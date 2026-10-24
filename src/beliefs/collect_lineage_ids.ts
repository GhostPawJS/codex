import type { CodexDb } from '../database.ts';

export const lineageQuery = `WITH RECURSIVE lineage(id) AS (
	SELECT id FROM beliefs WHERE id = ?
	UNION
	SELECT b.id FROM beliefs b JOIN lineage l ON b.superseded_by = l.id
	OR b.id = (SELECT superseded_by FROM beliefs WHERE id = l.id)
)`;

export function collectLineageIds(db: CodexDb, beliefId: number): number[] {
	return db
		.prepare(`${lineageQuery} SELECT id FROM lineage ORDER BY id`)
		.all<{ id: number }>(beliefId)
		.map(({ id }) => id);
}
