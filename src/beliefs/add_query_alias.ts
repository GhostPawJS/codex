import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { normalizeQueryAlias } from './normalize_query_alias.ts';

export function addQueryAlias(
	db: CodexDb,
	term: string,
	alias: string,
	options?: { now?: number },
): void {
	const words = normalizeQueryAlias(term, alias);
	db.prepare('INSERT OR IGNORE INTO query_aliases (term, alias, created_at) VALUES (?, ?, ?)').run(
		...words,
		resolveNow(options?.now),
	);
}
