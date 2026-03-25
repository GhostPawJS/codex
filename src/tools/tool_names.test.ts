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

describe('tool names', () => {
	it('exposes stable snake_case tool names', () => {
		strictEqual(searchCodexToolName, 'search_codex');
		strictEqual(reviewCodexToolName, 'review_codex');
		strictEqual(inspectCodexItemToolName, 'inspect_codex_item');
		strictEqual(rememberBeliefToolName, 'remember_belief');
		strictEqual(reviseBeliefToolName, 'revise_belief');
		strictEqual(retireBeliefToolName, 'retire_belief');
		strictEqual(dismissProximityToolName, 'dismiss_proximity');
	});
});
