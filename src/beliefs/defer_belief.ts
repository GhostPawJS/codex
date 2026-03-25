import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';

import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRecord, WriteOptions } from './types.ts';

export function deferBelief(
	db: CodexDb,
	beliefId: number,
	deferredUntil: number,
	options?: WriteOptions,
): BeliefRecord {
	const timestamp = resolveNow(options?.now);
	return withTransaction(db, () => {
		assertActiveBeliefExists(db, beliefId);
		db.prepare('UPDATE beliefs SET deferred_until = ?, verified_at = ? WHERE id = ?').run(
			deferredUntil,
			timestamp,
			beliefId,
		);
		return mapBeliefRow(assertActiveBeliefExists(db, beliefId), timestamp);
	});
}
