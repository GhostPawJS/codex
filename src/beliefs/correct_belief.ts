import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';

import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { listBeliefProximity } from './list_belief_proximity.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import { prepareBeliefStorage } from './prepare_belief_storage.ts';
import { sourceInitialCertainty } from './source_initial_certainty.ts';
import type { BeliefRow, CorrectBeliefInput, CorrectOptions, CorrectResult } from './types.ts';
import { clampCertainty } from './validators.ts';

export function correctBelief(
	db: CodexDb,
	beliefId: number,
	input: CorrectBeliefInput,
	options?: CorrectOptions,
): CorrectResult {
	const timestamp = resolveNow(options?.now);
	const record = withTransaction(db, () => {
		const current = assertActiveBeliefExists(db, beliefId);
		const nextSource = input.source ?? current.source;
		const nextCategory = input.category ?? current.category;
		const prepared = prepareBeliefStorage(input.claim);
		const certainty = clampCertainty(input.certainty ?? sourceInitialCertainty(nextSource));
		const result = db
			.prepare(`
			INSERT INTO beliefs (
				claim, claim_normalized, certainty, evidence, source, category, created_at, verified_at,
				superseded_by, provenance, deferred_until, embedding, embedding_norm, embedding_dim, embedding_version
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`)
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
			);
		const newId = Number(result.lastInsertRowid);
		db.prepare('UPDATE beliefs SET superseded_by = ?, verified_at = ? WHERE id = ?').run(
			newId,
			timestamp,
			beliefId,
		);
		const row = db.prepare('SELECT * FROM beliefs WHERE id = ?').get<BeliefRow>(newId);
		if (!row) {
			throw new Error('Corrected belief could not be reloaded.');
		}
		return mapBeliefRow(row, timestamp);
	});
	const proximity =
		options?.skipProximity === true ? [] : listBeliefProximity(db, record.id, 3, 0.7, timestamp);
	return { ...record, supersededId: beliefId, proximity };
}
