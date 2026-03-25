import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { directSupersessionBetweenBeliefsSkill } from './direct-supersession-between-beliefs.ts';
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

describe('direct-supersession-between-beliefs skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(directSupersessionBetweenBeliefsSkill, [
			'inspect_codex_item',
			'revise_belief',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(directSupersessionBetweenBeliefsSkill, DIRECT_API_NAMES);
	});

	it('simulates: inspect both → forget weaker with successorId', async () => {
		const db = await createSkillTestDb();
		const weak = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'App supports 100 concurrent users',
				source: 'inferred',
				category: 'capability',
			}),
		);
		const strong = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Load test confirmed 500 concurrent users',
				source: 'observed',
				category: 'capability',
			}),
		);

		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: weak.data.belief.id }));
		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: strong.data.belief.id }));

		const forgotten = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'forget',
				beliefId: weak.data.belief.id,
				successorId: strong.data.belief.id,
			}),
		);
		ok(forgotten.ok);

		const weakDetail = expectSuccess(
			inspectCodexItemToolHandler(db, { beliefId: weak.data.belief.id }),
		);
		strictEqual(weakDetail.data.detail.isActive, false);
		strictEqual(weakDetail.data.detail.supersededBy, strong.data.belief.id);

		const strongDetail = expectSuccess(
			inspectCodexItemToolHandler(db, { beliefId: strong.data.belief.id }),
		);
		ok(strongDetail.data.detail.isActive);
	});
});
