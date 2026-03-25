import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cosineSimilarity } from './cosine_similarity.ts';

describe('cosineSimilarity', () => {
	it('returns 1 for identical vectors', () => {
		strictEqual(cosineSimilarity(new Float32Array([1, 0]), new Float32Array([1, 0])), 1);
	});

	it('returns 0 for missing, zero, or mismatched vectors', () => {
		strictEqual(cosineSimilarity(null, new Float32Array([1])), 0);
		strictEqual(cosineSimilarity(new Float32Array([0, 0]), new Float32Array([1, 0])), 0);
		strictEqual(cosineSimilarity(new Float32Array([1]), new Float32Array([1, 0])), 0);
	});
});
