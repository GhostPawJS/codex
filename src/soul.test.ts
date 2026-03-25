import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { codexSoul, renderCodexSoulPromptFoundation } from './soul.ts';

describe('soul', () => {
	it('renders a prompt foundation for the codex soul', () => {
		strictEqual(renderCodexSoulPromptFoundation(codexSoul).includes('Epistemic Warden'), true);
	});
});
