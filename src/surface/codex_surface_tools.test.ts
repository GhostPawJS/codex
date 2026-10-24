import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateInput } from '../surfaces/validate_input.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';

const inputs: Record<string, Record<string, unknown>> = {
	search_codex: { query: 'tabs' },
	review_codex: { view: 'status' },
	inspect_codex_item: { beliefId: 1 },
	remember_belief: { claim: 'Tabs', source: 'explicit', category: 'preference' },
	revise_belief: { action: 'confirm', beliefId: 1 },
	retire_belief: { beliefId: 1 },
	dismiss_proximity: { beliefA: 1, beliefB: 2 },
};
test('every Codex schema accepts representative handler inputs and rejects invalid shapes', () => {
	for (const tool of codexSurfaceTools) {
		assert.ok(inputs[tool.name], tool.name);
		assert.deepEqual(validateInput(tool.inputSchema, inputs[tool.name]), [], tool.name);
		assert.ok(validateInput(tool.inputSchema, []).length, tool.name);
		for (const required of tool.inputSchema.required ?? []) {
			const input = { ...inputs[tool.name] };
			delete input[required];
			assert.ok(validateInput(tool.inputSchema, input).length, `${tool.name}.${required}`);
		}
	}
});
