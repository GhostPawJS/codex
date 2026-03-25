import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defineCodexSkill } from './skill_types.ts';

describe('defineCodexSkill', () => {
	it('returns the provided skill unchanged', () => {
		strictEqual(defineCodexSkill({ name: 'x', description: 'x', content: 'x' }).name, 'x');
	});
});
