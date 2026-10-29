import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';

import { listBeliefProximity } from './list_belief_proximity.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import { prepareBeliefStorage } from './prepare_belief_storage.ts';
import { appendProximityVector, currentProximitySnapshot } from './proximity_vectors.ts';
import { sourceInitialCertainty } from './source_initial_certainty.ts';
import type { BeliefRow, RememberBeliefInput, RememberOptions, RememberResult } from './types.ts';
import {
	assertBeliefCategory,
	assertBeliefClaim,
	assertBeliefSource,
	clampCertainty,
} from './validators.ts';

export function remember(
	db: CodexDb,
	input: RememberBeliefInput,
	options?: RememberOptions,
): RememberResult {
	assertBeliefClaim(input.claim);
	assertBeliefSource(input.source);
	assertBeliefCategory(input.category);
	const timestamp = resolveNow(options?.now);
	const prepared = prepareBeliefStorage(input.claim);
	const certainty = clampCertainty(input.certainty ?? sourceInitialCertainty(input.source));
	const snapshot = currentProximitySnapshot(db);
	let duplicate = false;
	const record = withTransaction(db, () => {
		if (!input.allowDuplicate) {
			const existing = db
				.prepare(
					'SELECT * FROM beliefs WHERE claim_normalized = ? AND superseded_by IS NULL ORDER BY id LIMIT 1',
				)
				.get<BeliefRow>(prepared.claimNormalized);
			if (existing) {
				duplicate = true;
				if (input.provenance != null)
					db.prepare('UPDATE beliefs SET provenance = ? WHERE id = ?').run(
						input.provenance,
						existing.id,
					);
				return mapBeliefRow(
					db.prepare('SELECT * FROM beliefs WHERE id = ?').get<BeliefRow>(existing.id) as BeliefRow,
					timestamp,
				);
			}
		}
		const result = db
			.prepare(
				`
			INSERT INTO beliefs (
				claim, claim_normalized, certainty, evidence, source, category, created_at, verified_at,
				superseded_by, provenance, deferred_until, embedding, embedding_norm, embedding_dim, embedding_version
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
			)
			.run(
				input.claim,
				prepared.claimNormalized,
				certainty,
				1,
				input.source,
				input.category,
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
		const row = db
			.prepare('SELECT * FROM beliefs WHERE id = ?')
			.get<BeliefRow>(Number(result.lastInsertRowid));
		if (!row) {
			throw new Error('Inserted belief could not be reloaded.');
		}
		return mapBeliefRow(row, timestamp);
	});
	if (duplicate) return { ...record, proximity: [], duplicate: true };
	appendProximityVector(db, snapshot, record.id, prepared.embedding);
	const proximity =
		options?.skipProximity === true ? [] : listBeliefProximity(db, record.id, 3, 0.7, timestamp);
	return { ...record, proximity };
}
