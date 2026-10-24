import type { CodexDb } from '../database.ts';

import type { BeliefCategory, TrendRecord } from './types.ts';

export function getTrends(db: CodexDb): TrendRecord {
	const counts = db
		.prepare(`SELECT
		(SELECT COUNT(*) FROM beliefs WHERE superseded_by IS NOT NULL AND certainty >= 0.8) AS revised,
		(SELECT COUNT(*) FROM beliefs WHERE superseded_by IS NULL AND id IN
		(SELECT superseded_by FROM beliefs GROUP BY superseded_by HAVING COUNT(*) > 1)) AS repeated`)
		.get<{ revised: number; repeated: number }>();
	const revisedHighCertaintyCount = Number(counts?.revised ?? 0);
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
		repeatedlyRevisedCount: Number(counts?.repeated ?? 0),
	};
}
