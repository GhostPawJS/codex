import type { FlagReasonCode } from '../beliefs/types.ts';

const FLAG_WEIGHTS: Record<FlagReasonCode, number> = {
	stale: 1,
	fading: 0.8,
	single_evidence: 0.7,
	unstable: 0.9,
	low_trust: 0.6,
	gap: 0.5,
};

export function flagWeight(reason: FlagReasonCode): number {
	return FLAG_WEIGHTS[reason];
}

export function computeReviewPriority(
	freshness: number,
	reasons: readonly FlagReasonCode[],
): number {
	const stackedWeight = reasons.reduce((sum, reason) => sum + flagWeight(reason), 0);
	return (1 - freshness) * Math.min(1.5, stackedWeight);
}
