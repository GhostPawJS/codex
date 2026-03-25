import type { CodexDb } from '../database.ts';
import { canonicalizeBeliefPair } from '../dismissals/canonicalize_belief_pair.ts';
import type { DismissalRow } from '../dismissals/types.ts';
import { buildQueryEmbedding } from '../lib/build_query_embedding.ts';
import { cosineSimilarity } from '../lib/cosine_similarity.ts';
import { deserializeVectorBlob } from '../lib/deserialize_vector_blob.ts';
import { resolveNow } from '../resolve_now.ts';

import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRow, ProximityResultItem } from './types.ts';

function loadActiveDismissals(db: CodexDb, beliefId: number, now: number): Set<string> {
	const rows = db
		.prepare(
			'SELECT belief_a, belief_b FROM dismissals WHERE (belief_a = ? OR belief_b = ?) AND resurface_after > ?',
		)
		.all<DismissalRow>(beliefId, beliefId, now);
	const suppressed = new Set<string>();
	for (const row of rows) {
		const other = row.belief_a === beliefId ? row.belief_b : row.belief_a;
		const [a, b] = canonicalizeBeliefPair(beliefId, other);
		suppressed.add(`${a}:${b}`);
	}
	return suppressed;
}

export function listBeliefProximity(
	db: CodexDb,
	beliefId: number,
	limit = 3,
	threshold = 0.7,
	now?: number,
): ProximityResultItem[] {
	const timestamp = resolveNow(now);
	const belief = assertActiveBeliefExists(db, beliefId);
	const originVector = deserializeVectorBlob(belief.embedding) ?? buildQueryEmbedding(belief.claim);
	const rows = db
		.prepare('SELECT * FROM beliefs WHERE superseded_by IS NULL AND id <> ?')
		.all<BeliefRow>(beliefId);
	if (rows.length === 0) return [];
	const dismissed = loadActiveDismissals(db, beliefId, timestamp);
	return rows
		.map((row) => ({
			row,
			similarity: cosineSimilarity(originVector, deserializeVectorBlob(row.embedding)),
		}))
		.filter(({ row, similarity }) => {
			if (similarity < threshold) return false;
			const [a, b] = canonicalizeBeliefPair(beliefId, row.id);
			return !dismissed.has(`${a}:${b}`);
		})
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, limit)
		.map(({ row, similarity }) => ({ ...mapBeliefRow(row, timestamp), similarity }));
}
