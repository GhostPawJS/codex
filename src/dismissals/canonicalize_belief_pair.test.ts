import { deepStrictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canonicalizeBeliefPair } from './canonicalize_belief_pair.ts';

describe('canonicalizeBeliefPair', () => {
	it('sorts ids into stable order', () => {
		deepStrictEqual(canonicalizeBeliefPair(5, 2), [2, 5]);
	});

	it('rejects identical ids', () => {
		throws(() => canonicalizeBeliefPair(2, 2), /distinct/i);
	});
});
