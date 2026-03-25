import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	toolFailure,
	toolNeedsClarification,
	toolNoOp,
	toolSuccess,
	toolWarning,
} from './tool_types.ts';

describe('tool result helpers', () => {
	it('creates success with data and entities', () => {
		const result = toolSuccess(
			'ok',
			{ count: 1 },
			{
				entities: [{ kind: 'belief', id: 1, title: 'test' }],
			},
		);
		strictEqual(result.ok, true);
		strictEqual(result.outcome, 'success');
		strictEqual(result.data.count, 1);
		strictEqual(result.entities.length, 1);
	});

	it('creates no_op result', () => {
		const result = toolNoOp('nothing changed', {});
		strictEqual(result.ok, true);
		strictEqual(result.outcome, 'no_op');
	});

	it('creates failure with error details', () => {
		const result = toolFailure('domain', 'not_found', 'Not found', 'Belief 99 not found.');
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'error');
		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'not_found');
	});

	it('creates clarification request', () => {
		const result = toolNeedsClarification('missing_required_choice', 'Which belief?', ['beliefId']);
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
		strictEqual(result.clarification.missing[0], 'beliefId');
	});

	it('creates warnings', () => {
		const w = toolWarning('empty_result', 'No results.');
		strictEqual(w.code, 'empty_result');
	});

	it('attaches next step hints and warnings', () => {
		const result = toolSuccess(
			'ok',
			{},
			{
				next: [{ kind: 'use_tool', message: 'try this', tool: 'search_codex' }],
				warnings: [toolWarning('empty_result', 'nothing found')],
			},
		);
		strictEqual(result.next?.length, 1);
		strictEqual(result.warnings?.length, 1);
	});
});
