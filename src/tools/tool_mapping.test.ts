import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import * as read from '../read.ts';
import * as write from '../write.ts';
import { codexToolMappings } from './tool_mapping.ts';
import { codexTools } from './tool_registry.ts';

describe('tool mapping', () => {
	it('covers all read exports', () => {
		const readExports = Object.keys(read);
		for (const name of readExports) {
			ok(
				codexToolMappings.some((m) => m.source === name),
				`Missing mapping for read export: ${name}`,
			);
		}
	});

	it('covers all write exports', () => {
		const writeExports = Object.keys(write);
		for (const name of writeExports) {
			ok(
				codexToolMappings.some((m) => m.source === name),
				`Missing mapping for write export: ${name}`,
			);
		}
	});

	it('every mapping references a registered tool', () => {
		const toolNames = new Set(codexTools.map((t) => t.name));
		for (const mapping of codexToolMappings) {
			ok(toolNames.has(mapping.tool), `Mapping references unknown tool: ${mapping.tool}`);
		}
	});

	it('maps 16 domain functions to 7 tools', () => {
		strictEqual(codexToolMappings.length, 16);
		const uniqueTools = new Set(codexToolMappings.map((m) => m.tool));
		strictEqual(uniqueTools.size, 7);
	});
});
