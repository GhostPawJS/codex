import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toolFailure, toolSuccess } from './tool_types.ts';

describe('tool result helpers', () => {
	it('creates success and failure envelopes', () => {
		strictEqual(toolSuccess('ok', {}).outcome, 'success');
		strictEqual(toolFailure('domain', 'invalid_input', 'bad', 'bad').outcome, 'error');
	});
});
