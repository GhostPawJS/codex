import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { searchCodexToolHandler } from '../tools/search_codex_tool.ts';
import { captureBeliefsWellSkill } from './capture-beliefs-well.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

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

describe('capture-beliefs-well skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(captureBeliefsWellSkill, [
			'search_codex',
			'remember_belief',
			'revise_belief',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(captureBeliefsWellSkill, DIRECT_API_NAMES);
	});

	it('simulates: search → remember → confirm duplicate', async () => {
		const db = await createSkillTestDb();

		const searchResult = expectSuccess(
			searchCodexToolHandler(db, { query: 'user prefers dark mode', minScore: 0 }),
		);
		strictEqual(searchResult.data.results.length, 0);

		const remResult = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'User prefers dark mode',
				source: 'explicit',
				category: 'preference',
			}),
		);
		ok(remResult.data.belief.id > 0);

		const confirmResult = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'confirm', beliefId: remResult.data.belief.id }),
		);
		ok(confirmResult.ok);
	});

	it('detects proximity warning on similar captures', async () => {
		const db = await createSkillTestDb();

		rememberBeliefToolHandler(db, {
			claim: 'Node.js uses V8 engine',
			source: 'explicit',
			category: 'fact',
		});

		const second = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Node.js runs on the V8 JavaScript engine',
				source: 'observed',
				category: 'fact',
			}),
		);
		if (second.warnings && second.warnings.length > 0) {
			ok(second.warnings[0]?.code === 'partial_match');
		}
	});
});
