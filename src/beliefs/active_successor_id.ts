import type { CodexDb } from '../database.ts';

export function activeSuccessorId(db: CodexDb, id: number): number | null {
	const seen = new Set<number>();
	while (!seen.has(id)) {
		seen.add(id);
		const row = db
			.prepare('SELECT superseded_by FROM beliefs WHERE id = ?')
			.get<{ superseded_by: number | null }>(id);
		if (!row) return null;
		if (row.superseded_by === null) return id;
		id = row.superseded_by;
	}
	return null;
}
