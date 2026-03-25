import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getCodexSkillByName, listCodexSkills } from './skill_registry.ts';

describe('skill registry', () => {
	it('lists and resolves codex skills', () => {
		strictEqual(listCodexSkills().length, 8);
		strictEqual(getCodexSkillByName('capture-beliefs-well')?.name, 'capture-beliefs-well');
	});
});
