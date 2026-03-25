import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { prepareBeliefStorage } from './prepare_belief_storage.ts';

describe('prepareBeliefStorage', () => {
	it('normalizes claims and prepares vector metadata', () => {
		const prepared = prepareBeliefStorage('GraphQL API');
		strictEqual(prepared.claimNormalized, 'graphql api');
		strictEqual(prepared.embeddingDim, 256);
		strictEqual(prepared.embeddingVersion, 'local-hash-v1');
	});
});
