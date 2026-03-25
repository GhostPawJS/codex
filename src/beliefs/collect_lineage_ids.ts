import type { CodexDb } from '../database.ts';

export function collectLineageIds(db: CodexDb, beliefId: number): number[] {
	const visited = new Set<number>();
	const queue = [beliefId];
	while (queue.length > 0) {
		const current = queue.shift();
		if (current === undefined || visited.has(current)) {
			continue;
		}
		const row = db
			.prepare('SELECT id, superseded_by AS supersededBy FROM beliefs WHERE id = ?')
			.get<{ id: number; supersededBy: number | null }>(current);
		if (!row) {
			continue;
		}
		visited.add(current);
		if (row.supersededBy !== null && !visited.has(row.supersededBy)) {
			queue.push(row.supersededBy);
		}
		const predecessors = db
			.prepare('SELECT id FROM beliefs WHERE superseded_by = ?')
			.all<{ id: number }>(current);
		for (const predecessor of predecessors) {
			if (!visited.has(predecessor.id)) {
				queue.push(predecessor.id);
			}
		}
	}
	return [...visited].sort((a, b) => a - b);
}
