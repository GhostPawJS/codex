import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { codexSkills, getCodexSkillByName, listCodexSkills } from './skill_registry.ts';

const TOOL_NAMES = [
	'search_codex',
	'review_codex',
	'inspect_codex_item',
	'remember_belief',
	'revise_belief',
	'retire_belief',
	'dismiss_proximity',
];

const DIRECT_API_NAMES = [
	'recall',
	'getBeliefDetail',
	'getBeliefLineage',
	'getStatus',
	'getTrends',
	'listBeliefProximity',
	'listFlags',
	'listLog',
	'remember',
	'confirmBelief',
	'correctBelief',
	'deferBelief',
	'deleteBelief',
	'forgetBelief',
	'mergeBeliefs',
	'dismissProximityPair',
];

describe('skill registry', () => {
	it('contains exactly 17 skills', () => {
		strictEqual(codexSkills.length, 17);
		strictEqual(listCodexSkills().length, 17);
	});

	it('resolves every skill by name', () => {
		for (const skill of codexSkills) {
			const found = getCodexSkillByName(skill.name);
			ok(found !== null, `skill ${skill.name} should be findable by name`);
			strictEqual(found?.name, skill.name);
		}
	});

	it('returns null for unknown skill names', () => {
		strictEqual(getCodexSkillByName('nonexistent-skill'), null);
	});

	it('every skill has a non-empty name, description, and content', () => {
		for (const skill of codexSkills) {
			ok(skill.name.length > 0, `${skill.name} needs a name`);
			ok(skill.description.length > 0, `${skill.name} needs a description`);
			ok(skill.content.length > 50, `${skill.name} needs substantial content`);
		}
	});

	it('every skill name is unique', () => {
		const names = codexSkills.map((s) => s.name);
		strictEqual(new Set(names).size, names.length);
	});

	it('every skill mentions at least one tool name in content', () => {
		for (const skill of codexSkills) {
			const mentionsTool = TOOL_NAMES.some((t) => skill.content.includes(`\`${t}\``));
			ok(mentionsTool, `${skill.name} should mention at least one tool`);
		}
	});

	it('no skill references direct API function calls in content', () => {
		for (const skill of codexSkills) {
			for (const api of DIRECT_API_NAMES) {
				strictEqual(
					skill.content.includes(`${api}(`),
					false,
					`${skill.name} should not reference ${api}()`,
				);
			}
		}
	});
});
