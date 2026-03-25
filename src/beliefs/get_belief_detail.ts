import type { CodexDb } from '../database.ts';
import { computeVersionDiff } from '../lib/version_diff.ts';
import { resolveNow } from '../resolve_now.ts';

import { getBeliefLineage } from './get_belief_lineage.ts';
import { listBeliefProximity } from './list_belief_proximity.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefDetailRecord, BeliefRow } from './types.ts';

export function getBeliefDetail(
	db: CodexDb,
	beliefId: number,
	now?: number,
): BeliefDetailRecord | null {
	const timestamp = resolveNow(now);
	const row = db.prepare('SELECT * FROM beliefs WHERE id = ?').get<BeliefRow>(beliefId);
	if (!row) {
		return null;
	}
	const record = mapBeliefRow(row, timestamp);
	const lineage = getBeliefLineage(db, beliefId, timestamp);
	const predecessor = lineage.find((entry) => entry.supersededBy === record.id) ?? null;
	return {
		...record,
		lineageDepth: lineage.length,
		proximity: record.isActive ? listBeliefProximity(db, beliefId, 3, 0.7, timestamp) : [],
		versionDiff: predecessor ? computeVersionDiff(predecessor.claim, record.claim) : null,
	};
}
