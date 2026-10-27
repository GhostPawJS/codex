import type { CodexDb } from '../database.ts';
import { CodexValidationError } from '../errors.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';

import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import { prepareBeliefStorage } from './prepare_belief_storage.ts';
import { sourceInitialCertainty } from './source_initial_certainty.ts';
import type { BeliefRecord, BeliefRow, MergeBeliefsInput, WriteOptions } from './types.ts';
import { clampCertainty } from './validators.ts';

export function mergeBeliefs(
	db: CodexDb,
	input: MergeBeliefsInput,
	options?: WriteOptions,
): BeliefRecord {
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
			db.prepare('UPDATE beliefs SET evidence = ?, certainty = ? WHERE id = ?').run(
				evidence,
				certainty,
				successor.id,
			);
			return mapBeliefRow({ ...successor, evidence, certainty }, timestamp);
		}
		const primary = beliefs[0];
		if (!primary) {
			throw new CodexValidationError('Merging beliefs requires at least one primary belief.');
		}
		const claim = input.claim ?? beliefs.map((belief) => belief.claim).join(' / ');
		const prepared = prepareBeliefStorage(claim);
		const source = input.source ?? primary.source;
		const category = input.category ?? primary.category;
		const certainty = clampCertainty(
			input.certainty ??
				Math.max(sourceInitialCertainty(source), ...beliefs.map((belief) => belief.certainty)),
		);
		const result = db
			.prepare(`
			INSERT INTO beliefs (
				claim, claim_normalized, certainty, evidence, source, category, created_at, verified_at,
				superseded_by, provenance, deferred_until, embedding, embedding_norm, embedding_dim, embedding_version
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)
			.run(
				claim,
				prepared.claimNormalized,
				certainty,
				beliefs.reduce((sum, belief) => sum + belief.evidence, 0),
				source,
				category,
				timestamp,
				timestamp,
				null,
				input.provenance ?? null,
				null,
				prepared.embedding,
				prepared.embeddingNorm,
				prepared.embeddingDim,
				prepared.embeddingVersion,
			);
		const successorId = Number(result.lastInsertRowid);
		for (const belief of beliefs) {
			db.prepare(
				`UPDATE beliefs SET superseded_by = ?, superseded_reason = 'merged', verified_at = ? WHERE id = ?`,
			).run(successorId, timestamp, belief.id);
		}
		const row = db.prepare('SELECT * FROM beliefs WHERE id = ?').get<BeliefRow>(successorId);
		if (!row) {
			throw new Error('Merged belief could not be reloaded.');
		}
		return mapBeliefRow(row, timestamp);
	});
}
