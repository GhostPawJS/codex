import type { CodexDb } from '../database.ts';

export function listQueryAliases(
	db: CodexDb,
): { term: string; alias: string; createdAt: number }[] {
	return db
		.prepare('SELECT term, alias, created_at AS createdAt FROM query_aliases ORDER BY term, alias')
		.all<{ term: string; alias: string; createdAt: number }>()
		.map((row) => ({ ...row }));
}
