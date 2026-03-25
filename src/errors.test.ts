import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CodexConflictError, CodexError, CodexValidationError, isCodexError } from './errors.ts';

describe('errors', () => {
	it('creates typed codex errors', () => {
		const error = new CodexConflictError('boom');
		strictEqual(error instanceof CodexError, true);
		strictEqual(error.code, 'conflict');
		strictEqual(error.name, 'CodexConflictError');
	});

	it('detects codex errors', () => {
		strictEqual(isCodexError(new CodexValidationError('bad')), true);
		strictEqual(isCodexError(new Error('bad')), false);
	});
});
