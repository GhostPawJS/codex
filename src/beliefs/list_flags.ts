import type { CodexDb } from '../database.ts';
import { computeReviewPriority } from '../lib/review_priority.ts';
import { resolveNow } from '../resolve_now.ts';

import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRow, FlagReasonCode, FlagResultItem } from './types.ts';

function collectReasons(
	row: BeliefRow,
	recordFreshness: number,
	lineageDepth: number,
	categoryCount: number,
	totalActive: number,
): FlagReasonCode[] {
	return [
		recordFreshness < 0.4 ? 'stale' : recordFreshness < 0.7 ? 'fading' : null,
		row.evidence === 1 ? 'single_evidence' : null,
		lineageDepth > 2 ? 'unstable' : null,
		row.source === 'distilled' || row.source === 'inferred' ? 'low_trust' : null,
		totalActive >= 5 && categoryCount <= 1 ? 'gap' : null,
	].filter((reason): reason is FlagReasonCode => reason !== null);
}

function buildLineageDepthMap(db: CodexDb): Map<number, number> {
	const edges = db
		.prepare('SELECT id, superseded_by FROM beliefs WHERE superseded_by IS NOT NULL')
		.all<{ id: number; superseded_by: number }>();
	const groups = new Map<number, Set<number>>();
	function group(id: number): Set<number> {
		let members = groups.get(id);
		if (!members) {
			members = new Set([id]);
			groups.set(id, members);
		}
		return members;
	}
	for (const { id, superseded_by } of edges) {
		let a = group(id);
		let b = group(superseded_by);
		if (a === b) continue;
		if (a.size < b.size) [a, b] = [b, a];
		for (const member of b) {
			a.add(member);
			groups.set(member, a);
		}
	}
	return new Map([...groups].map(([id, members]) => [id, members.size]));
}

export function listFlags(db: CodexDb, now?: number): FlagResultItem[] {
	const timestamp = resolveNow(now);
	const rows = db.prepare('SELECT * FROM beliefs WHERE superseded_by IS NULL').all<BeliefRow>();
	const categoryCounts = new Map<string, number>();
	for (const row of rows) {
		categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1);
	}
	const lineageDepths = buildLineageDepthMap(db);
	return rows
		.filter((row) => row.deferred_until === null || row.deferred_until <= timestamp)
		.map((row) => {
			const record = mapBeliefRow(row, timestamp);
			const lineageDepth = lineageDepths.get(row.id) ?? 1;
			const reasons = collectReasons(
				row,
				record.freshness,
				lineageDepth,
				categoryCounts.get(row.category) ?? 0,
				rows.length,
			);
			return {
				...record,
				reasonCodes: reasons,
				reviewPriority: computeReviewPriority(record.freshness, reasons),
				lineageDepth,
			};
		})
		.filter((record) => record.reasonCodes.length > 0)
		.sort((a, b) => b.reviewPriority - a.reviewPriority);
}
