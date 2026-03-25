import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';

import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRecord, WriteOptions } from './types.ts';

export function confirmBelief(db: CodexDb, beliefId: number, options?: WriteOptions): BeliefRecord {
	const timestamp = resolveNow(options?.now);
	return withTransaction(db, () => {
		const current = assertActiveBeliefExists(db, beliefId);
		const certainty = Math.min(0.99, 0.3 * 1 + 0.7 * current.certainty);
		db.prepare('UPDATE beliefs SET certainty = ?, evidence = ?, verified_at = ? WHERE id = ?').run(
			certainty,
			current.evidence + 1,
			timestamp,
			beliefId,
		);
		const row = assertActiveBeliefExists(db, beliefId);
		return mapBeliefRow(row, timestamp);
	});
}
