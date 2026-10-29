import type { CodexDb } from '../database.ts';
import { CodexNotFoundError } from '../errors.ts';
import { activeSuccessorId } from './active_successor_id.ts';

import { getActiveBeliefRow } from './get_active_belief_row.ts';
import type { BeliefRow } from './types.ts';

export function assertActiveBeliefExists(db: CodexDb, beliefId: number): BeliefRow {
	const row = getActiveBeliefRow(db, beliefId);
	if (row === null) {
		const successor = activeSuccessorId(db, beliefId);
		if (successor !== null)
			throw new CodexNotFoundError(
				`Belief ${beliefId} was superseded by ${successor}; use ${successor}.`,
			);
		throw new CodexNotFoundError(`Active belief ${beliefId} was not found.`);
	}
	return row;
}
