import type { CodexDb } from '../database.ts';

import type { BeliefCategory, BeliefRow, TrendRecord } from './types.ts';

function countRepeatedlyRevised(db: CodexDb): number {
	const rows = db
		.prepare(`
			SELECT superseded_by, COUNT(*) AS depth
			FROM beliefs
			WHERE superseded_by IS NOT NULL
			GROUP BY superseded_by
			HAVING depth > 1
		`)
		.all<{ superseded_by: number; depth: number }>();
	const unstableTargets = new Set(rows.map((r) => r.superseded_by));
	const activeUnstable = Number(
		unstableTargets.size === 0
			? 0
			: (db
					.prepare(
						`SELECT COUNT(*) AS count FROM beliefs WHERE superseded_by IS NULL AND id IN (${[...unstableTargets].map(() => '?').join(', ')})`,
					)
					.get(...unstableTargets)?.count ?? 0),
	);
	return activeUnstable;
}

export function getTrends(db: CodexDb): TrendRecord {
	const activeRows = db
		.prepare('SELECT * FROM beliefs WHERE superseded_by IS NULL')
		.all<BeliefRow>();
	const revisedHighCertaintyCount = Number(
		db
			.prepare(
				'SELECT COUNT(*) AS count FROM beliefs WHERE superseded_by IS NOT NULL AND certainty >= 0.8',
			)
			.get()?.count ?? 0,
	);
	const categoryCounts = new Map<BeliefCategory, number>();
	for (const row of activeRows) {
		categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1);
	}
	const growingCategories = [...categoryCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([category, count]) => ({ category, count }));
	const calibrationAlerts =
		revisedHighCertaintyCount > 0 ? ['High-certainty beliefs have required revision.'] : [];
	return {
		growingCategories,
		calibrationAlerts,
		revisedHighCertaintyCount,
		repeatedlyRevisedCount: countRepeatedlyRevised(db),
	};
}
