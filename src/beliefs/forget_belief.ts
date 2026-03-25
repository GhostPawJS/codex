import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';

import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRecord, BeliefRow, ForgetOptions } from './types.ts';

export function forgetBelief(db: CodexDb, beliefId: number, options?: ForgetOptions): BeliefRecord {
	const timestamp = resolveNow(options?.now);
	return withTransaction(db, () => {
		assertActiveBeliefExists(db, beliefId);
		if (options?.successorId !== undefined) {
			assertActiveBeliefExists(db, options.successorId);
		}
		const next = options?.successorId ?? beliefId;
		db.prepare('UPDATE beliefs SET superseded_by = ?, verified_at = ? WHERE id = ?').run(
			next,
			timestamp,
			beliefId,
		);
		const row = db.prepare('SELECT * FROM beliefs WHERE id = ?').get<BeliefRow>(beliefId);
		if (!row) {
			throw new Error('Forgotten belief could not be reloaded.');
		}
		return mapBeliefRow(row, timestamp);
	});
}
