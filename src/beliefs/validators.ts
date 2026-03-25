import { CodexValidationError } from '../errors.ts';

import {
	BELIEF_CATEGORIES,
	BELIEF_SOURCES,
	type BeliefCategory,
	type BeliefSource,
} from './types.ts';

export function assertBeliefClaim(claim: string): void {
	if (claim.trim().length === 0) {
		throw new CodexValidationError('Belief claim must not be empty.');
	}
}

export function assertBeliefSource(source: string): asserts source is BeliefSource {
	if (!BELIEF_SOURCES.includes(source as BeliefSource)) {
		throw new CodexValidationError(`Unsupported belief source: ${source}.`);
	}
}

export function assertBeliefCategory(category: string): asserts category is BeliefCategory {
	if (!BELIEF_CATEGORIES.includes(category as BeliefCategory)) {
		throw new CodexValidationError(`Unsupported belief category: ${category}.`);
	}
}

export function clampCertainty(certainty: number, maxCertainty = 0.99): number {
	if (!Number.isFinite(certainty)) {
		throw new CodexValidationError('Certainty must be a finite number.');
	}
	return Math.min(maxCertainty, Math.max(0.1, certainty));
}
