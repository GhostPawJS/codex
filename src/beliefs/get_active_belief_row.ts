import type { CodexDb } from '../database.ts';

import type { BeliefRow } from './types.ts';

export function getActiveBeliefRow(db: CodexDb, beliefId: number): BeliefRow | null {
	return (
		db
			.prepare('SELECT * FROM beliefs WHERE id = ? AND superseded_by IS NULL')
			.get<BeliefRow>(beliefId) ?? null
	);
}
