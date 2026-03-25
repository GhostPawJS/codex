import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildQueryEmbedding } from './build_query_embedding.ts';

describe('buildQueryEmbedding', () => {
	it('builds deterministic normalized vectors', () => {
		const a = buildQueryEmbedding('GraphQL API');
		const b = buildQueryEmbedding('GraphQL API');
		strictEqual(a.length, 256);
		strictEqual(Array.from(a).join(','), Array.from(b).join(','));
	});

	it('returns a zero vector for empty input', () => {
		const vector = buildQueryEmbedding('   ', 8);
		strictEqual(Array.from(vector).join(','), '0,0,0,0,0,0,0,0');
	});
});
