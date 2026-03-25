import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { searchCodexToolName } from './tool_names.ts';

describe('tool names', () => {
	it('exposes stable tool names', () => {
		strictEqual(searchCodexToolName, 'search_codex');
	});
});
