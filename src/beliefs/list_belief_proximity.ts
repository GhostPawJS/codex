import type { CodexDb } from '../database.ts';
import type { DismissalRow } from '../dismissals/types.ts';
import { buildQueryEmbedding } from '../lib/build_query_embedding.ts';
import { cosineSimilarity } from '../lib/cosine_similarity.ts';
import { deserializeVectorBlob } from '../lib/deserialize_vector_blob.ts';
import { resolveNow } from '../resolve_now.ts';
import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import { loadProximityVectors } from './proximity_vectors.ts';
import type { BeliefRow, ProximityResultItem } from './types.ts';

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
	const rows = loadProximityVectors(db);
	if (rows.length < 2) return [];
	const dismissed = new Set(
		db
			.prepare(
				'SELECT belief_a, belief_b FROM dismissals WHERE (belief_a = ? OR belief_b = ?) AND resurface_after > ?',
			)
			.all<DismissalRow>(beliefId, beliefId, timestamp)
			.map((row) => (row.belief_a === beliefId ? row.belief_b : row.belief_a)),
	);
	return rows
		.filter((row) => row.id !== beliefId && !dismissed.has(row.id))
		.map((row) => ({ id: row.id, similarity: cosineSimilarity(originVector, row.vector) }))
		.filter(({ similarity }) => !(similarity < threshold))
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, limit)
		.map(({ id, similarity }) => {
			// Full records are needed only for the selected matches, not the entire vector scan.
			const selected = db.prepare('SELECT * FROM beliefs WHERE id = ?').get<BeliefRow>(id);
			if (!selected) throw new Error('Proximity belief could not be reloaded.');
			return { ...mapBeliefRow(selected, timestamp), similarity };
		});
}
