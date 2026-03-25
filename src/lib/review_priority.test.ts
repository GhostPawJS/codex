import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeReviewPriority, flagWeight } from './review_priority.ts';

describe('review priority helpers', () => {
	it('returns configured weights', () => {
		strictEqual(flagWeight('stale'), 1);
	});

	it('stacks reasons against inverse freshness', () => {
		strictEqual(
			computeReviewPriority(0.2, ['stale']) > computeReviewPriority(0.8, ['stale']),
			true,
		);
	});
});
