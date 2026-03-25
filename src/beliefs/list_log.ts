import type { CodexDb } from '../database.ts';

import type { BeliefRow, LogRecord, LogRecordType } from './types.ts';

function buildMergeTargetSet(db: CodexDb): Set<number> {
	const rows = db
		.prepare(
			'SELECT superseded_by FROM beliefs WHERE superseded_by IS NOT NULL GROUP BY superseded_by HAVING COUNT(*) > 1',
		)
		.all<{ superseded_by: number }>();
	return new Set(rows.map((r) => r.superseded_by));
}

function classifyLogType(row: BeliefRow, mergeTargets: Set<number>): LogRecordType {
	if (row.superseded_by !== null) {
		if (row.superseded_by === row.id) return 'forgotten';
		if (mergeTargets.has(row.superseded_by)) return 'merged';
		return 'revised';
	}
	if (row.evidence > 1 && row.verified_at > row.created_at) return 'confirmed';
	return 'remembered';
}

export function listLog(db: CodexDb, limit = 20): LogRecord[] {
	const mergeTargets = buildMergeTargetSet(db);
	return db
		.prepare('SELECT * FROM beliefs ORDER BY verified_at DESC, created_at DESC LIMIT ?')
		.all<BeliefRow>(limit)
		.map((row) => ({
			id: row.id,
			type: classifyLogType(row, mergeTargets),
			at: Math.max(row.created_at, row.verified_at),
			claim: row.claim,
		}));
}
