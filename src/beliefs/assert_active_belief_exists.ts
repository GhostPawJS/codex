import type { CodexDb } from '../database.ts';
import { CodexNotFoundError } from '../errors.ts';

import { getActiveBeliefRow } from './get_active_belief_row.ts';
import type { BeliefRow } from './types.ts';

export function assertActiveBeliefExists(db: CodexDb, beliefId: number): BeliefRow {
	const row = getActiveBeliefRow(db, beliefId);
	if (row === null) {
		const old = db
			.prepare('SELECT superseded_by FROM beliefs WHERE id = ?')
			.get<{ superseded_by: number | null }>(beliefId);
		if (old?.superseded_by && old.superseded_by !== beliefId)
			throw new CodexNotFoundError(
				`Belief ${beliefId} was superseded by ${old.superseded_by}; use ${old.superseded_by}.`,
			);
		throw new CodexNotFoundError(`Active belief ${beliefId} was not found.`);
	}
	return row;
}
