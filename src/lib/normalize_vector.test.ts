import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeVector } from './normalize_vector.ts';

describe('normalizeVector', () => {
	it('normalizes non-zero vectors', () => {
		const vector = normalizeVector([3, 4]);
		strictEqual((vector[0] ?? 0).toFixed(2), '0.60');
		strictEqual((vector[1] ?? 0).toFixed(2), '0.80');
	});

	it('leaves zero vectors unchanged', () => {
		const vector = normalizeVector([0, 0, 0]);
		strictEqual(Array.from(vector).join(','), '0,0,0');
	});
});
