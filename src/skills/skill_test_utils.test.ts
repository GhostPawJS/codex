import { throws } from 'node:assert';
import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('skill_test_utils', () => {
	it('creates initialized test databases for skill scenarios', async () => {
		const db = await createSkillTestDb();
		const review = expectSuccess(reviewCodexToolHandler(db, { view: 'flags' }));
		strictEqual(review.ok, true);
	});

	it('checks tool mentions and direct-api avoidance in skill content', () => {
		const cleanSkill = {
			name: 'clean',
			description: 'Clean.',
			content: 'Use `search_codex` before `inspect_codex_item`.',
		};
		expectSkillMentionsTools(cleanSkill, ['search_codex', 'inspect_codex_item']);
		expectSkillAvoidsDirectApi(cleanSkill, ['recall', 'getBeliefDetail']);

		throws(() => expectSkillMentionsTools(cleanSkill, ['remember_belief']));
		throws(() =>
			expectSkillAvoidsDirectApi({ ...cleanSkill, content: 'Call recall() directly.' }, ['recall']),
		);
	});
});
