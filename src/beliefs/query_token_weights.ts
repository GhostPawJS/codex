import type { CodexDb } from '../database.ts';
import { expandQuery } from './expand_query.ts';
import { normalizeClaim } from './normalize_claim.ts';

export function queryTokenWeights(
	db: CodexDb,
	query: string,
): { weights: Map<string, number>; informative: string[]; commonOnly: boolean } {
	const tokens = [...new Set(normalizeClaim(expandQuery(db, query)).split(/\s+/).filter(Boolean))];
	const total =
		db.prepare('SELECT COUNT(*) AS n FROM beliefs WHERE superseded_by IS NULL').get<{ n: number }>()
			?.n ?? 0;
	const weights = new Map<string, number>();
	const informative: string[] = [];
	let informativeMatch = false;
	let commonMatch = false;
	for (const token of tokens) {
		// Keep FTS as the outer loop; starting from the active index repeats MATCH for every row.
		const df =
			db
				.prepare(
					`SELECT COUNT(*) AS n FROM beliefs_fts CROSS JOIN beliefs ON beliefs.id = beliefs_fts.rowid WHERE beliefs_fts MATCH ? AND beliefs.superseded_by IS NULL`,
				)
				.get<{ n: number }>(`${token}*`)?.n ?? 0;
		// A term is corpus-wide only with at least five documents and at most one exception.
		const common = total >= 5 && df >= total - 1;
		weights.set(token, Math.log(1 + (total + 1) / (df + 1)));
		if (common && df) commonMatch = true;
		if (!common) {
			informative.push(token);
			if (df) informativeMatch = true;
		}
	}
	return { weights, informative, commonOnly: commonMatch && !informativeMatch };
}
