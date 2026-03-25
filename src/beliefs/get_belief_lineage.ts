import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

import { collectLineageIds } from './collect_lineage_ids.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRecord, BeliefRow } from './types.ts';

export function getBeliefLineage(db: CodexDb, beliefId: number, now?: number): BeliefRecord[] {
	const timestamp = resolveNow(now);
	const ids = collectLineageIds(db, beliefId);
	if (ids.length === 0) {
		return [];
	}
	const placeholders = ids.map(() => '?').join(', ');
	const rows = db
		.prepare(`SELECT * FROM beliefs WHERE id IN (${placeholders}) ORDER BY created_at ASC, id ASC`)
		.all<BeliefRow>(...ids);
	return rows.map((row) => mapBeliefRow(row, timestamp));
}
