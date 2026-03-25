import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { initCodexTables, read, tools, write } from './index.ts';

describe('package root exports', () => {
	it('exposes the main codex namespaces', () => {
		strictEqual(typeof initCodexTables, 'function');
		strictEqual(typeof read.recall, 'function');
		strictEqual(typeof write.remember, 'function');
		strictEqual(Array.isArray(tools.codexTools), true);
	});
});
