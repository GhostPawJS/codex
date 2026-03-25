import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	dismissProximityToolName,
	inspectCodexItemToolName,
	reviewCodexToolName,
	reviseBeliefToolName,
	searchCodexToolName,
} from './tool_names.ts';
import {
	dismissNext,
	inspectItemNext,
	retryNext,
	reviewViewNext,
	reviseNext,
	searchNext,
	useToolNext,
} from './tool_next.ts';

describe('inspectItemNext', () => {
	it('builds an inspect_item hint with beliefId', () => {
		const hint = inspectItemNext(42, 'My claim');
		strictEqual(hint.kind, 'inspect_item');
		strictEqual(hint.tool, inspectCodexItemToolName);
		strictEqual(hint.suggestedInput?.beliefId, 42);
		strictEqual(hint.message.includes('My claim'), true);
	});

	it('falls back to numeric message when claim is absent', () => {
		const hint = inspectItemNext(7);
		strictEqual(hint.message.includes('7'), true);
		strictEqual(hint.message.includes('undefined'), false);
	});
});

describe('useToolNext', () => {
	it('builds a use_tool hint with arbitrary tool and input', () => {
		const hint = useToolNext('some_tool', 'Do something.', { key: 'val' });
		strictEqual(hint.kind, 'use_tool');
		strictEqual(hint.tool, 'some_tool');
		strictEqual(hint.suggestedInput?.key, 'val');
	});

	it('works without suggestedInput', () => {
		const hint = useToolNext('t', 'msg');
		strictEqual(hint.suggestedInput, undefined);
	});
});

describe('reviewViewNext', () => {
	it('builds a review_view hint targeting the review tool', () => {
		const hint = reviewViewNext('flags', 'Check flags.');
		strictEqual(hint.kind, 'review_view');
		strictEqual(hint.tool, reviewCodexToolName);
		strictEqual(hint.suggestedInput?.view, 'flags');
	});

	it('supports all four views', () => {
		for (const view of ['flags', 'status', 'log', 'trends'] as const) {
			strictEqual(reviewViewNext(view, 'x').suggestedInput?.view, view);
		}
	});
});

describe('retryNext', () => {
	it('builds a retry_with hint', () => {
		const hint = retryNext('Try again.', { beliefId: 5 });
		strictEqual(hint.kind, 'retry_with');
		strictEqual(hint.suggestedInput?.beliefId, 5);
	});

	it('works without suggestedInput', () => {
		const hint = retryNext('Retry.');
		strictEqual(hint.suggestedInput, undefined);
	});
});

describe('searchNext', () => {
	it('builds a use_tool hint targeting search_codex', () => {
		const hint = searchNext('GraphQL', 'Search for GraphQL.');
		strictEqual(hint.kind, 'use_tool');
		strictEqual(hint.tool, searchCodexToolName);
		strictEqual(hint.suggestedInput?.query, 'GraphQL');
	});
});

describe('dismissNext', () => {
	it('builds a use_tool hint targeting dismiss_proximity', () => {
		const hint = dismissNext(1, 2);
		strictEqual(hint.kind, 'use_tool');
		strictEqual(hint.tool, dismissProximityToolName);
		strictEqual(hint.suggestedInput?.beliefA, 1);
		strictEqual(hint.suggestedInput?.beliefB, 2);
	});
});

describe('reviseNext', () => {
	it('builds a use_tool hint targeting revise_belief', () => {
		const hint = reviseNext('confirm', 3, 'Confirm it.');
		strictEqual(hint.kind, 'use_tool');
		strictEqual(hint.tool, reviseBeliefToolName);
		strictEqual(hint.suggestedInput?.action, 'confirm');
		strictEqual(hint.suggestedInput?.beliefId, 3);
	});
});
