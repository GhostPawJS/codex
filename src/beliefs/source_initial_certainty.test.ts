import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sourceInitialCertainty } from './source_initial_certainty.ts';

describe('sourceInitialCertainty', () => {
	it('returns the source-weighted default certainty', () => {
		strictEqual(sourceInitialCertainty('explicit'), 0.9);
		strictEqual(sourceInitialCertainty('inferred'), 0.5);
	});
});
