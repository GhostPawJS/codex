import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getCodexToolByName, listCodexToolDefinitions } from './tool_registry.ts';

describe('tool registry', () => {
	it('lists codex tool definitions and resolves by name', () => {
		strictEqual(listCodexToolDefinitions().length, 7);
		strictEqual(getCodexToolByName('search_codex')?.name, 'search_codex');
	});
});
