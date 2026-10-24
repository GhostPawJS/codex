import type { CodexDb } from '../database.ts';
import { computeFreshness } from '../lib/freshness.ts';
import { resolveNow } from '../resolve_now.ts';

import { getStrengthTier } from './map_belief_row.ts';
import type {
	BeliefCategory,
	BeliefRow,
	BeliefSource,
	StatusRecord,
	StrengthTier,
} from './types.ts';

export function getStatus(db: CodexDb, now?: number): StatusRecord {
	const timestamp = resolveNow(now);
	const totalBeliefCount = Number(
		db.prepare('SELECT COUNT(*) AS count FROM beliefs').get()?.count ?? 0,
	);
	const activeRows = db
		.prepare(
			'SELECT certainty, evidence, source, category, verified_at FROM beliefs WHERE superseded_by IS NULL',
		)
		.all<Pick<BeliefRow, 'certainty' | 'evidence' | 'source' | 'category' | 'verified_at'>>();
	const strengthCounts = { strong: 0, fading: 0, faint: 0 } as Record<StrengthTier, number>;
	const sourceCounts = { explicit: 0, observed: 0, distilled: 0, inferred: 0 } as Record<
		BeliefSource,
		number
	>;
	const categoryCounts = {
		preference: 0,
		fact: 0,
		procedure: 0,
		capability: 0,
		custom: 0,
	} as Record<BeliefCategory, number>;
	const certainty: [number, number, number, number, number] = [0, 0, 0, 0, 0];
	const evidence: [number, number, number, number] = [0, 0, 0, 0];
	let certaintySum = 0;
	let freshnessSum = 0;
	for (const row of activeRows) {
		strengthCounts[getStrengthTier(row.certainty)] += 1;
		sourceCounts[row.source] += 1;
		categoryCounts[row.category] += 1;
		const c = row.certainty;
		certainty[c >= 0.9 ? 4 : c >= 0.7 ? 3 : c >= 0.5 ? 2 : c >= 0.3 ? 1 : 0] += 1;
		const e = row.evidence;
		evidence[e >= 10 ? 3 : e >= 4 ? 2 : e >= 2 ? 1 : 0] += 1;
		certaintySum += c;
		freshnessSum += computeFreshness(row.verified_at, timestamp, e);
	}
	const activeCount = activeRows.length;
	return {
		activeBeliefCount: activeCount,
		totalBeliefCount,
		integrity: activeCount === 0 ? 0 : (strengthCounts.strong / activeCount) * 100,
		strengthCounts,
		sourceCounts,
		categoryCounts,
		certaintyDistribution: {
			veryLow: certainty[0],
			low: certainty[1],
			moderate: certainty[2],
			high: certainty[3],
			veryHigh: certainty[4],
		},
		evidenceDistribution: {
			single: evidence[0],
			few: evidence[1],
			moderate: evidence[2],
			strong: evidence[3],
		},
		averageCertainty: activeCount === 0 ? 0 : certaintySum / activeCount,
		averageFreshness: activeCount === 0 ? 0 : freshnessSum / activeCount,
	};
}
