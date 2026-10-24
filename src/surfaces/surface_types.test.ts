import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isErrorResult } from './surface_types.ts';

test('default error predicate includes clarification but accepts ordinary objects', () => {
	for (const value of [
		{ ok: false, outcome: 'error' },
		{ ok: false, outcome: 'needs_clarification' },
	])
		assert.equal(isErrorResult(value), true);
	for (const value of [null, [], 0, { ok: true }, { error: 'text' }])
		assert.equal(isErrorResult(value), false);
});
