import type { CodexDb } from '../database.ts';
import { normalizeQueryAlias } from './normalize_query_alias.ts';

export function removeQueryAlias(db: CodexDb, term: string, alias: string): boolean {
	const result = db
		.prepare('DELETE FROM query_aliases WHERE term = ? AND alias = ?')
		.run(...normalizeQueryAlias(term, alias));
	return (result.changes ?? 0) > 0;
}
