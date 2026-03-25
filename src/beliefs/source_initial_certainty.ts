import type { BeliefSource } from './types.ts';

const SOURCE_INITIAL_CERTAINTY: Record<BeliefSource, number> = {
	explicit: 0.9,
	observed: 0.8,
	distilled: 0.6,
	inferred: 0.5,
};

export function sourceInitialCertainty(source: BeliefSource): number {
	return SOURCE_INITIAL_CERTAINTY[source];
}
