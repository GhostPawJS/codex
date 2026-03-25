import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeFreshness } from './freshness.ts';

describe('computeFreshness', () => {
	it('returns 1 for fresh beliefs', () => {
		strictEqual(computeFreshness(100, 100, 1), 1);
	});

	it('decays more slowly with more evidence', () => {
		const low = computeFreshness(0, 90 * 24 * 60 * 60 * 1000, 1);
		const high = computeFreshness(0, 90 * 24 * 60 * 60 * 1000, 16);
		strictEqual(high > low, true);
	});
});
