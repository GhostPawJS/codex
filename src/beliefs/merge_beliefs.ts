import type { CodexDb } from '../database.ts';
import { CodexValidationError } from '../errors.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';
import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { getBeliefRow } from './get_belief_row.ts';
import { inheritProvenance } from './inherit_provenance.ts';
import { insertBeliefSql } from './insert_belief_sql.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import { prepareBeliefStorage } from './prepare_belief_storage.ts';
import { sourceInitialCertainty } from './source_initial_certainty.ts';
import type { BeliefRecord, BeliefRow, MergeBeliefsInput, WriteOptions } from './types.ts';
import { assertBeliefTopic, clampCertainty } from './validators.ts';

export function mergeBeliefs(
	db: CodexDb,
	input: MergeBeliefsInput,
	options?: WriteOptions,
): BeliefRecord {
	assertBeliefTopic(input.topic);
	const uniqueIds = [...new Set(input.beliefIds)];
	if (
		uniqueIds.length === 0 ||
		(uniqueIds.length < 2 &&
			(input.successorId === undefined || uniqueIds.includes(input.successorId)))
	) {
		throw new CodexValidationError(
			'Merging beliefs requires at least two distinct active beliefs.',
		);
	}
	const timestamp = resolveNow(options?.now);
	return withTransaction(db, () => {
		const beliefs = uniqueIds.map((beliefId) => assertActiveBeliefExists(db, beliefId));
		if (input.successorId !== undefined) {
			const successor = assertActiveBeliefExists(db, input.successorId);
			for (const belief of beliefs) {
				if (belief.id !== successor.id) {
					db.prepare(
						`UPDATE beliefs SET superseded_by = ?, superseded_reason = 'merged', verified_at = ? WHERE id = ?`,
					).run(successor.id, timestamp, belief.id);
				}
			}
			if (input.topic !== undefined)
				db.prepare('UPDATE beliefs SET topic=? WHERE id=?').run(input.topic, successor.id);
			const mergedIn = beliefs.filter((belief) => belief.id !== successor.id);
			const evidence =
				successor.evidence + mergedIn.reduce((sum, belief) => sum + belief.evidence, 0);
			const certainty = clampCertainty(
				input.certainty ??
					Math.max(
						sourceInitialCertainty(input.source ?? successor.source),
						successor.certainty,
						...beliefs.map((belief) => belief.certainty),
					),
			);
			const provenance =
				input.provenance ??
				([successor, ...beliefs].every((belief) => belief.provenance === successor.provenance)
					? successor.provenance
					: null);
			db.prepare('UPDATE beliefs SET evidence = ?, certainty = ?, provenance = ? WHERE id = ?').run(
				evidence,
				certainty,
				provenance,
				successor.id,
			);
			inheritProvenance(
				db,
				successor.id,
				mergedIn.map((belief) => belief.id),
			);
			return mapBeliefRow(getBeliefRow(db, successor.id) as BeliefRow, timestamp);
		}
		// uniqueIds is nonempty, and every id was resolved above.
		const primary = beliefs[0] as BeliefRow;
		const claim = input.claim ?? beliefs.map((belief) => belief.claim).join(' / ');
		const prepared = prepareBeliefStorage(claim);
		const source = input.source ?? primary.source;
		const category = input.category ?? primary.category;
		const certainty = clampCertainty(
			input.certainty ??
				Math.max(sourceInitialCertainty(source), ...beliefs.map((belief) => belief.certainty)),
		);
		const result = db.prepare(insertBeliefSql).run(
			claim,
			prepared.claimNormalized,
			certainty,
			beliefs.reduce((sum, belief) => sum + belief.evidence, 0),
			source,
			category,
			timestamp,
			timestamp,
			null,
			input.provenance ??
				(beliefs.every((belief) => belief.provenance === primary.provenance)
					? primary.provenance
					: null),
			null,
			prepared.embedding,
			prepared.embeddingNorm,
			prepared.embeddingDim,
			prepared.embeddingVersion,
			input.topic ?? primary.topic ?? null,
		);
		const successorId = Number(result.lastInsertRowid);
		for (const belief of beliefs) {
			db.prepare(
				`UPDATE beliefs SET superseded_by = ?, superseded_reason = 'merged', verified_at = ? WHERE id = ?`,
			).run(successorId, timestamp, belief.id);
		}
		inheritProvenance(db, successorId, uniqueIds);
		const row = getBeliefRow(db, successorId);
		if (!row) throw new Error('Merged belief could not be reloaded.');
		return mapBeliefRow(row, timestamp);
	});
}
