import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dismissProximityToolHandler } from '../tools/dismiss_proximity_tool.ts';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { searchCodexToolHandler } from '../tools/search_codex_tool.ts';
import { handleAmbiguousBeliefUpdatesSkill } from './handle-ambiguous-belief-updates.ts';
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

describe('handle-ambiguous-belief-updates skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(handleAmbiguousBeliefUpdatesSkill, [
			'search_codex',
			'inspect_codex_item',
			'revise_belief',
			'dismiss_proximity',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(handleAmbiguousBeliefUpdatesSkill, DIRECT_API_NAMES);
	});

	it('simulates: search → inspect → confirm unchanged', async () => {
		const db = await createSkillTestDb();
		const orig = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Team uses 2-week sprints',
				source: 'explicit',
				category: 'procedure',
			}),
		);

		const search = expectSuccess(
			searchCodexToolHandler(db, { query: 'sprint length', minScore: 0 }),
		);
		ok(search.data.results.length >= 1);

		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: orig.data.belief.id }));

		const confirmed = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'confirm', beliefId: orig.data.belief.id }),
		);
		ok(confirmed.ok);
	});

	it('simulates: search → inspect → correct replacement', async () => {
		const db = await createSkillTestDb();
		const orig = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'API uses REST',
				source: 'observed',
				category: 'fact',
			}),
		);

		const corrected = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'correct',
				beliefId: orig.data.belief.id,
				claim: 'API migrated to GraphQL',
			}),
		);
		ok(corrected.ok);
	});

	it('simulates: dismiss unrelated overlap', async () => {
		const db = await createSkillTestDb();
		const a = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Deployment uses Docker',
				source: 'observed',
				category: 'procedure',
			}),
		);
		const b = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Testing uses Docker containers',
				source: 'observed',
				category: 'procedure',
			}),
		);
		const dismissed = expectSuccess(
			dismissProximityToolHandler(db, {
				beliefA: a.data.belief.id,
				beliefB: b.data.belief.id,
			}),
		);
		strictEqual(dismissed.data.dismissal.dismissCount, 1);
	});
});
