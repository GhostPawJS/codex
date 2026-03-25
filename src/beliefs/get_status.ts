import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

import { mapBeliefRow } from './map_belief_row.ts';
import type {
	BeliefCategory,
	BeliefRecord,
	BeliefRow,
	BeliefSource,
	CertaintyDistribution,
	EvidenceDistribution,
	StatusRecord,
	StrengthTier,
} from './types.ts';

function classifyCertainty(records: readonly BeliefRecord[]): CertaintyDistribution {
	const dist: CertaintyDistribution = { veryLow: 0, low: 0, moderate: 0, high: 0, veryHigh: 0 };
	for (const r of records) {
		if (r.certainty >= 0.9) dist.veryHigh += 1;
		else if (r.certainty >= 0.7) dist.high += 1;
		else if (r.certainty >= 0.5) dist.moderate += 1;
		else if (r.certainty >= 0.3) dist.low += 1;
		else dist.veryLow += 1;
	}
	return dist;
}

function classifyEvidence(records: readonly BeliefRecord[]): EvidenceDistribution {
	const dist: EvidenceDistribution = { single: 0, few: 0, moderate: 0, strong: 0 };
	for (const r of records) {
		if (r.evidence >= 10) dist.strong += 1;
		else if (r.evidence >= 4) dist.moderate += 1;
		else if (r.evidence >= 2) dist.few += 1;
		else dist.single += 1;
	}
	return dist;
}

export function getStatus(db: CodexDb, now?: number): StatusRecord {
	const timestamp = resolveNow(now);
	const totalBeliefCount = Number(
		db.prepare('SELECT COUNT(*) AS count FROM beliefs').get()?.count ?? 0,
	);
	const activeRows = db
		.prepare('SELECT * FROM beliefs WHERE superseded_by IS NULL')
		.all<BeliefRow>();
	const active = activeRows.map((row) => mapBeliefRow(row, timestamp));
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
	for (const record of active) {
		strengthCounts[record.strength] += 1;
		sourceCounts[record.source] += 1;
		categoryCounts[record.category] += 1;
	}
	const activeCount = active.length;
	const averageCertainty =
		activeCount === 0 ? 0 : active.reduce((sum, record) => sum + record.certainty, 0) / activeCount;
	const averageFreshness =
		activeCount === 0 ? 0 : active.reduce((sum, record) => sum + record.freshness, 0) / activeCount;
	return {
		activeBeliefCount: activeCount,
		totalBeliefCount,
		integrity: activeCount === 0 ? 0 : (strengthCounts.strong / activeCount) * 100,
		strengthCounts,
		sourceCounts,
		categoryCounts,
		certaintyDistribution: classifyCertainty(active),
		evidenceDistribution: classifyEvidence(active),
		averageCertainty,
		averageFreshness,
	};
}
