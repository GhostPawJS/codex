import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { preRegisterBeliefsBeforeDecisionsSkill } from './pre-register-beliefs-before-decisions.ts';
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

describe('pre-register-beliefs-before-decisions skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(preRegisterBeliefsBeforeDecisionsSkill, [
			'remember_belief',
			'revise_belief',
			'review_codex',
			'inspect_codex_item',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(preRegisterBeliefsBeforeDecisionsSkill, DIRECT_API_NAMES);
	});

	it('simulates: pre-register → defer → outcome → correct', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'New cache layer will reduce latency by 50%',
				source: 'inferred',
				category: 'capability',
				certainty: 0.6,
				provenance: 'Q3 performance review prediction',
			}),
		);

		const futureDate = Date.now() + 90 * 24 * 60 * 60 * 1000;
		expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'defer',
				beliefId: rem.data.belief.id,
				deferredUntil: futureDate,
			}),
		);

		const corrected = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'correct',
				beliefId: rem.data.belief.id,
				claim: 'Cache layer reduced latency by 35%, not 50%',
				certainty: 0.9,
				source: 'observed',
			}),
		);
		ok(corrected.ok);

		const trends = expectSuccess(reviewCodexToolHandler(db, { view: 'trends' }));
		ok(trends.data.payload.view === 'trends');
	});

	it('simulates: pre-register → defer → outcome → confirm if correct', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Migration will complete in 2 weeks',
				source: 'inferred',
				category: 'fact',
				certainty: 0.7,
			}),
		);

		const futureDate = Date.now() + 14 * 24 * 60 * 60 * 1000;
		expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'defer',
				beliefId: rem.data.belief.id,
				deferredUntil: futureDate,
			}),
		);

		const confirmed = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'confirm', beliefId: rem.data.belief.id }),
		);
		ok(confirmed.ok);

		const detail = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: rem.data.belief.id }));
		ok(detail.data.detail.evidence >= 2);
	});
});
