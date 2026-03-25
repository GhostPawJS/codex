import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	CodexConflictError,
	CodexInvariantError,
	CodexNotFoundError,
	CodexStateError,
	CodexValidationError,
} from '../errors.ts';
import {
	beliefEntityHint,
	beliefNotFoundHints,
	translateToolError,
	withToolHandling,
} from './tool_errors.ts';

describe('translateToolError', () => {
	it('maps CodexNotFoundError to domain/not_found with recovery', () => {
		const result = translateToolError(new CodexNotFoundError('Belief 5 not found.'));
		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'not_found');
		ok(result.error.recovery);
		ok(result.next && result.next.length > 0);
	});

	it('maps CodexValidationError to protocol/invalid_input', () => {
		const result = translateToolError(new CodexValidationError('Bad input.'));
		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'invalid_input');
	});

	it('maps CodexStateError to domain/invalid_state', () => {
		const result = translateToolError(new CodexStateError('Already superseded.'));
		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'invalid_state');
	});

	it('maps CodexConflictError to domain/invalid_state', () => {
		const result = translateToolError(new CodexConflictError('Conflict.'));
		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'invalid_state');
	});

	it('maps CodexInvariantError to system/system_error', () => {
		const result = translateToolError(new CodexInvariantError('Invariant violated.'));
		strictEqual(result.error.kind, 'system');
		strictEqual(result.error.code, 'system_error');
	});

	it('maps unknown errors to system/system_error', () => {
		const result = translateToolError(new Error('Unexpected failure.'));
		strictEqual(result.error.kind, 'system');
		strictEqual(result.error.code, 'system_error');
	});

	it('maps non-Error values to system/system_error', () => {
		const result = translateToolError('a string error');
		strictEqual(result.error.kind, 'system');
		strictEqual(result.error.code, 'system_error');
		ok(result.error.message.includes('a string error'));
	});

	it('uses custom summary when provided', () => {
		const result = translateToolError(new Error('x'), { summary: 'Custom summary.' });
		strictEqual(result.summary, 'Custom summary.');
	});

	it('uses custom next hints when provided', () => {
		const customNext = [{ kind: 'use_tool' as const, message: 'Do this.', tool: 'some_tool' }];
		const result = translateToolError(new CodexNotFoundError('gone'), { next: customNext });
		strictEqual(result.next?.length, 1);
		strictEqual(result.next?.[0]?.message, 'Do this.');
	});
});

describe('withToolHandling', () => {
	it('returns the function result on success', () => {
		const wrapped = withToolHandling((x: number) => x * 2);
		strictEqual(wrapped(5), 10);
	});

	it('catches errors and returns ToolFailure', () => {
		const wrapped = withToolHandling(() => {
			throw new CodexNotFoundError('Gone.');
		});
		const result = wrapped();
		ok(typeof result === 'object' && result !== null && 'ok' in result);
		strictEqual((result as { ok: boolean }).ok, false);
	});

	it('passes custom summary through options', () => {
		const wrapped = withToolHandling(
			() => {
				throw new Error('boom');
			},
			{ summary: 'Wrapper error.' },
		);
		const result = wrapped() as { summary: string };
		strictEqual(result.summary, 'Wrapper error.');
	});
});

describe('beliefNotFoundHints', () => {
	it('returns search and review hints for a missing belief', () => {
		const hints = beliefNotFoundHints(42);
		strictEqual(hints.length, 2);
		ok(hints.some((h) => h.tool === 'search_codex'));
		ok(hints.some((h) => h.tool === 'review_codex'));
		ok(hints[0]?.message.includes('42'));
	});
});

describe('beliefEntityHint', () => {
	it('returns an inspect hint for a belief', () => {
		const hint = beliefEntityHint(7, 'My claim');
		strictEqual(hint.kind, 'inspect_item');
		ok(hint.message.includes('My claim'));
	});

	it('works without a claim', () => {
		const hint = beliefEntityHint(7);
		strictEqual(hint.kind, 'inspect_item');
		ok(hint.message.includes('7'));
	});
});
