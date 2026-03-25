import { computeFreshness } from '../lib/freshness.ts';

import type { BeliefRecord, BeliefRow, StrengthTier } from './types.ts';

export function getStrengthTier(certainty: number): StrengthTier {
	if (certainty >= 0.7) return 'strong';
	if (certainty >= 0.4) return 'fading';
	return 'faint';
}

export function mapBeliefRow(row: BeliefRow, now: number): BeliefRecord {
	return {
		id: row.id,
		claim: row.claim,
		claimNormalized: row.claim_normalized,
		certainty: row.certainty,
		evidence: row.evidence,
		source: row.source,
		category: row.category,
		createdAt: row.created_at,
		verifiedAt: row.verified_at,
		supersededBy: row.superseded_by,
		provenance: row.provenance,
		deferredUntil: row.deferred_until,
		freshness: computeFreshness(row.verified_at, now, row.evidence),
		strength: getStrengthTier(row.certainty),
		isActive: row.superseded_by === null,
		lastChangedAt: Math.max(row.created_at, row.verified_at),
	};
}
