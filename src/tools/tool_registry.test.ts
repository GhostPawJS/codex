import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	dismissProximityToolName,
	inspectCodexItemToolName,
	rememberBeliefToolName,
	retireBeliefToolName,
	reviewCodexToolName,
	reviseBeliefToolName,
	searchCodexToolName,
} from './tool_names.ts';
import { codexTools, getCodexToolByName, listCodexToolDefinitions } from './tool_registry.ts';

describe('tool registry', () => {
	it('contains exactly 7 tools in canonical order', () => {
		strictEqual(codexTools.length, 7);
		strictEqual(codexTools[0]?.name, searchCodexToolName);
		strictEqual(codexTools[1]?.name, reviewCodexToolName);
		strictEqual(codexTools[2]?.name, inspectCodexItemToolName);
		strictEqual(codexTools[3]?.name, rememberBeliefToolName);
		strictEqual(codexTools[4]?.name, reviseBeliefToolName);
		strictEqual(codexTools[5]?.name, retireBeliefToolName);
		strictEqual(codexTools[6]?.name, dismissProximityToolName);
	});

	it('lists all definitions', () => {
		strictEqual(listCodexToolDefinitions().length, 7);
	});

	it('finds a tool by name', () => {
		strictEqual(getCodexToolByName('search_codex')?.name, 'search_codex');
	});

	it('returns null for unknown tool name', () => {
		strictEqual(getCodexToolByName('nonexistent'), null);
	});

	it('every tool has required metadata fields', () => {
		for (const tool of codexTools) {
			strictEqual(typeof tool.name, 'string');
			strictEqual(typeof tool.description, 'string');
			strictEqual(typeof tool.whenToUse, 'string');
			strictEqual(typeof tool.whenNotToUse, 'string');
			strictEqual(typeof tool.readOnly, 'boolean');
			strictEqual(typeof tool.sideEffects, 'string');
			strictEqual(typeof tool.outputDescription, 'string');
			strictEqual(tool.inputSchema.type, 'object');
			strictEqual(typeof tool.handler, 'function');
		}
	});
});
