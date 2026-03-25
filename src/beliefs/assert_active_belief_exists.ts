import type { CodexDb } from '../database.ts';
import { CodexNotFoundError } from '../errors.ts';

import { getActiveBeliefRow } from './get_active_belief_row.ts';
import type { BeliefRow } from './types.ts';

export function assertActiveBeliefExists(db: CodexDb, beliefId: number): BeliefRow {
	const row = getActiveBeliefRow(db, beliefId);
	if (row === null) {
		throw new CodexNotFoundError(`Active belief ${beliefId} was not found.`);
	}
	return row;
}
