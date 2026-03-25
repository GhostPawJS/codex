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
	const reasons: FlagReasonCode[] = [];
	if (recordFreshness < 0.4) reasons.push('stale');
	else if (recordFreshness < 0.7) reasons.push('fading');
	if (row.evidence === 1) reasons.push('single_evidence');
	if (lineageDepth > 2) reasons.push('unstable');
	if (row.source === 'distilled' || row.source === 'inferred') reasons.push('low_trust');
	if (totalActive >= 5 && categoryCount <= 1) reasons.push('gap');
	return reasons;
}

function buildLineageDepthMap(db: CodexDb): Map<number, number> {
	const edges = db
		.prepare('SELECT id, superseded_by FROM beliefs WHERE superseded_by IS NOT NULL')
		.all<{ id: number; superseded_by: number }>();
	if (edges.length === 0) return new Map();
	const adj = new Map<number, number[]>();
	const allIds = new Set<number>();
	for (const { id, superseded_by } of edges) {
		allIds.add(id);
		allIds.add(superseded_by);
		let neighbors = adj.get(id);
		if (!neighbors) {
			neighbors = [];
			adj.set(id, neighbors);
		}
		neighbors.push(superseded_by);
		let reverseNeighbors = adj.get(superseded_by);
		if (!reverseNeighbors) {
			reverseNeighbors = [];
			adj.set(superseded_by, reverseNeighbors);
		}
		reverseNeighbors.push(id);
	}
	const visited = new Set<number>();
	const depthMap = new Map<number, number>();
	for (const startId of allIds) {
		if (visited.has(startId)) continue;
		const component: number[] = [];
		const stack = [startId];
		while (stack.length > 0) {
			const current = stack.pop();
			if (current === undefined) continue;
			if (visited.has(current)) continue;
			visited.add(current);
			component.push(current);
			const neighbors = adj.get(current);
			if (neighbors) {
				for (const neighbor of neighbors) {
					if (!visited.has(neighbor)) stack.push(neighbor);
				}
			}
		}
		for (const id of component) {
			depthMap.set(id, component.length);
		}
	}
	return depthMap;
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
