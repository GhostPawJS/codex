import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

import { lineageQuery } from './collect_lineage_ids.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRecord, BeliefRow } from './types.ts';

export function getBeliefLineage(db: CodexDb, beliefId: number, now?: number): BeliefRecord[] {
	const timestamp = resolveNow(now);
	const rows = db
		.prepare(
			`${lineageQuery} SELECT * FROM beliefs WHERE id IN (SELECT id FROM lineage) ORDER BY created_at ASC, id ASC`,
		)
		.all<BeliefRow>(beliefId);
	return rows.map((row) => mapBeliefRow(row, timestamp));
}
