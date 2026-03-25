import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BELIEF_CATEGORIES, BELIEF_SOURCES, FLAG_REASON_CODES } from './types.ts';

describe('belief type constants', () => {
	it('exposes the supported source and category enums', () => {
		strictEqual(BELIEF_SOURCES.includes('explicit'), true);
		strictEqual(BELIEF_CATEGORIES.includes('fact'), true);
		strictEqual(FLAG_REASON_CODES.includes('stale'), true);
	});
});
