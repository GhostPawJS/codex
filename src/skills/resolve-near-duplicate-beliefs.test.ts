import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dismissProximityToolHandler } from '../tools/dismiss_proximity_tool.ts';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { resolveNearDuplicateBeliefsSkill } from './resolve-near-duplicate-beliefs.ts';
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

describe('resolve-near-duplicate-beliefs skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(resolveNearDuplicateBeliefsSkill, [
			'inspect_codex_item',
			'revise_belief',
			'dismiss_proximity',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(resolveNearDuplicateBeliefsSkill, DIRECT_API_NAMES);
	});

	it('simulates: inspect both → forget weaker with successor', async () => {
		const db = await createSkillTestDb();
		const a = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'PostgreSQL supports JSON columns',
				source: 'explicit',
				category: 'fact',
			}),
		);
		const b = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'PostgreSQL has JSON and JSONB column types',
				source: 'observed',
				category: 'fact',
			}),
		);

		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: a.data.belief.id }));
		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: b.data.belief.id }));

		const forgetResult = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'forget',
				beliefId: a.data.belief.id,
				successorId: b.data.belief.id,
			}),
		);
		ok(forgetResult.ok);

		const inspectSurvivor = expectSuccess(
			inspectCodexItemToolHandler(db, { beliefId: b.data.belief.id }),
		);
		ok(inspectSurvivor.data.detail.isActive);
	});

	it('simulates: dismiss genuinely distinct pair', async () => {
		const db = await createSkillTestDb();
		const a = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'CSS Grid is for 2D layouts',
				source: 'explicit',
				category: 'fact',
			}),
		);
		const b = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'CSS Flexbox is for 1D layouts',
				source: 'explicit',
				category: 'fact',
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
