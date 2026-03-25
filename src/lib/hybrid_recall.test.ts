import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { hybridRecall } from './hybrid_recall.ts';

describe('hybridRecall', () => {
	it('fuses semantic and lexical ranks', () => {
		const results = hybridRecall(
			new Float32Array([1, 0]),
			[
				{ id: 1, value: 'a', vector: new Float32Array([1, 0]), lexicalRank: 2, recallWeight: 1 },
				{ id: 2, value: 'b', vector: new Float32Array([0, 1]), lexicalRank: 1, recallWeight: 1 },
			],
			10,
			0,
		);
		strictEqual(results[0]?.id, 1);
	});
});
