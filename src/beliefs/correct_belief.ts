import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';
import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { getBeliefRow } from './get_belief_row.ts';
import { inheritProvenance } from './inherit_provenance.ts';
import { insertBeliefSql } from './insert_belief_sql.ts';
import { listBeliefProximity } from './list_belief_proximity.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import { prepareBeliefStorage } from './prepare_belief_storage.ts';
import { sourceInitialCertainty } from './source_initial_certainty.ts';
import type { BeliefRow, CorrectBeliefInput, CorrectOptions, CorrectResult } from './types.ts';
import { assertBeliefTopic, clampCertainty } from './validators.ts';

export function correctBelief(
	db: CodexDb,
	beliefId: number,
	input: CorrectBeliefInput,
	options?: CorrectOptions,
): CorrectResult {
	assertBeliefTopic(input.topic);
	const timestamp = resolveNow(options?.now);
	const record = withTransaction(db, () => {
		const current = assertActiveBeliefExists(db, beliefId);
		const nextSource = input.source ?? current.source;
		const nextCategory = input.category ?? current.category;
		const prepared = prepareBeliefStorage(input.claim);
		if (
			prepared.claimNormalized === current.claim_normalized &&
			nextSource === current.source &&
			nextCategory === current.category &&
			(input.topic === undefined || input.topic === current.topic) &&
			(input.certainty === undefined || input.certainty === current.certainty)
		) {
			if (input.provenance != null)
				db.prepare('UPDATE beliefs SET provenance = ? WHERE id = ?').run(
					input.provenance,
					beliefId,
				);
			return mapBeliefRow(getBeliefRow(db, beliefId) as BeliefRow, timestamp);
		}
		const certainty = clampCertainty(input.certainty ?? sourceInitialCertainty(nextSource));
		const result = db
			.prepare(insertBeliefSql)
			.run(
				input.claim,
				prepared.claimNormalized,
				certainty,
				1,
				nextSource,
				nextCategory,
				timestamp,
				timestamp,
				null,
				input.provenance ?? current.provenance,
				null,
				prepared.embedding,
				prepared.embeddingNorm,
				prepared.embeddingDim,
				prepared.embeddingVersion,
				input.topic ?? current.topic ?? null,
			);
		const newId = Number(result.lastInsertRowid);
		db.prepare(
			`UPDATE beliefs SET superseded_by = ?, superseded_reason = 'corrected', verified_at = ? WHERE id = ?`,
		).run(newId, timestamp, beliefId);
		inheritProvenance(db, newId, [beliefId]);
		const row = getBeliefRow(db, newId);
		if (!row) throw new Error('Corrected belief could not be reloaded.');
		return mapBeliefRow(row, timestamp);
	});
	const proximity =
		options?.skipProximity === true ? [] : listBeliefProximity(db, record.id, 3, 0.7, timestamp);
	return { ...record, supersededId: beliefId, proximity };
}
