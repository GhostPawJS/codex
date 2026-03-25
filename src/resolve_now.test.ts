import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveNow } from './resolve_now.ts';

describe('resolveNow', () => {
	it('returns the explicit timestamp when provided', () => {
		strictEqual(resolveNow(42), 42);
		strictEqual(resolveNow(0), 0);
	});

	it('returns a recent finite timestamp when omitted', () => {
		const value = resolveNow();
		strictEqual(typeof value, 'number');
		strictEqual(Number.isFinite(value), true);
		strictEqual(value <= Date.now() + 1, true);
		strictEqual(value >= Date.now() - 60_000, true);
	});
});
