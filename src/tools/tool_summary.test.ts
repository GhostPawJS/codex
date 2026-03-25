import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { summarizeCount } from './tool_summary.ts';

describe('summarizeCount', () => {
	it('uses singular for count of 1', () => {
		strictEqual(summarizeCount(1, 'belief'), '1 belief');
	});

	it('auto-pluralizes by appending s', () => {
		strictEqual(summarizeCount(0, 'belief'), '0 beliefs');
		strictEqual(summarizeCount(5, 'belief'), '5 beliefs');
	});

	it('uses explicit plural when provided', () => {
		strictEqual(summarizeCount(2, 'entry', 'entries'), '2 entries');
	});

	it('uses explicit plural even for zero', () => {
		strictEqual(summarizeCount(0, 'entry', 'entries'), '0 entries');
	});

	it('uses singular for exactly 1 even with explicit plural', () => {
		strictEqual(summarizeCount(1, 'entry', 'entries'), '1 entry');
	});
});
