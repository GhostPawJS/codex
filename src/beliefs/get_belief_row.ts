import type { CodexDb } from '../database.ts';
import type { BeliefRow } from './types.ts';

/** Load a belief regardless of its active or superseded state. */
export function getBeliefRow(db: CodexDb, id: number): BeliefRow | undefined {
	return db.prepare('SELECT * FROM beliefs WHERE id = ?').get<BeliefRow>(id);
}
