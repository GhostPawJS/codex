import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeClaim } from './normalize_claim.ts';

describe('normalizeClaim', () => {
	it('normalizes whitespace and punctuation', () => {
		strictEqual(normalizeClaim('  GraphQL, API!  '), 'graphql api');
	});
});
