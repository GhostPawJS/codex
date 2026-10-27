import type { CodexDb } from '../database.ts';

import type { BeliefCategory, TrendRecord } from './types.ts';

export function getTrends(db: CodexDb): TrendRecord {
	const rows = db
		.prepare(`SELECT id, superseded_by, superseded_reason, certainty FROM beliefs`)
		.all<{
			id: number;
			superseded_by: number | null;
			superseded_reason: string | null;
			certainty: number;
		}>();
	const fanIn = new Map<number, number>();
	for (const row of rows)
		if (row.superseded_by !== null)
			fanIn.set(row.superseded_by, (fanIn.get(row.superseded_by) ?? 0) + 1);
	const corrections = rows.filter(
		(row) =>
			row.superseded_by !== null &&
			(row.superseded_reason === 'corrected' ||
				(row.superseded_reason === null &&
					row.superseded_by !== row.id &&
					(fanIn.get(row.superseded_by) ?? 0) <= 1)),
	);
	const revisedHighCertaintyCount = corrections.filter((row) => row.certainty >= 0.8).length;
	const predecessors = new Map(corrections.map((row) => [row.superseded_by, row.id]));
	const repeatedlyRevisedCount = rows.filter(
		(row) =>
			row.superseded_by === null &&
			predecessors.has(row.id) &&
			predecessors.has(predecessors.get(row.id) as number),
	).length;
	const growingCategories = db
		.prepare(`SELECT category, COUNT(*) AS count FROM beliefs
		WHERE superseded_by IS NULL GROUP BY category ORDER BY count DESC, MIN(id) ASC LIMIT 3`)
		.all<{ category: BeliefCategory; count: number }>()
		.map(({ category, count }) => ({ category, count }));
	const calibrationAlerts =
		revisedHighCertaintyCount > 0 ? ['High-certainty beliefs have required revision.'] : [];
	return {
		growingCategories,
		calibrationAlerts,
		revisedHighCertaintyCount,
		repeatedlyRevisedCount: repeatedlyRevisedCount,
	};
}
