import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderWorkflowGuide } from './render_workflow_guide.ts';

test('guide tool references include CLI equivalents and preserve other prose', () => {
	assert.equal(
		renderWorkflowGuide({ content: 'Use `search_codex`, `remember_belief`, and `custom`.' }),
		'Use `search_codex` (CLI: `ghostpaw-codex search`), `remember_belief` (CLI: `ghostpaw-codex belief add`), and `custom`.',
	);
});
