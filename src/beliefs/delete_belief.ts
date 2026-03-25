import type { CodexDb } from '../database.ts';
import { withTransaction } from '../with_transaction.ts';

import { collectLineageIds } from './collect_lineage_ids.ts';

export function deleteBelief(db: CodexDb, beliefId: number): number[] {
	return withTransaction(db, () => {
		const lineageIds = collectLineageIds(db, beliefId);
		if (lineageIds.length === 0) {
			return [];
		}
		const placeholders = lineageIds.map(() => '?').join(', ');
		db.prepare(
			`DELETE FROM dismissals WHERE belief_a IN (${placeholders}) OR belief_b IN (${placeholders})`,
		).run(...lineageIds, ...lineageIds);
		db.prepare(`DELETE FROM beliefs WHERE id IN (${placeholders})`).run(...lineageIds);
		return lineageIds;
	});
}
