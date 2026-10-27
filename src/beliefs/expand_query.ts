import type { CodexDb } from '../database.ts';
import { normalizeClaim } from './normalize_claim.ts';

export function expandQuery(db: CodexDb, query: string): string {
	const tokens = normalizeClaim(query).split(/\s+/).filter(Boolean);
	const seen = new Set(tokens);
	const extra: string[] = [];
	const statement = db.prepare('SELECT alias FROM query_aliases WHERE term = ? ORDER BY alias');
	for (const token of tokens) {
		for (const { alias } of statement.all<{ alias: string }>(token)) {
			if (!seen.has(alias)) {
				seen.add(alias);
				extra.push(alias);
			}
		}
	}
	return extra.length ? `${query} ${extra.join(' ')}` : query;
}
