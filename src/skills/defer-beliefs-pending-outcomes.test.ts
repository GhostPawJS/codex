import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { deferBeliefsPendingOutcomesSkill } from './defer-beliefs-pending-outcomes.ts';
import {
	createSkillTestDb,
	expectClarification,
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

describe('defer-beliefs-pending-outcomes skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(deferBeliefsPendingOutcomesSkill, [
			'review_codex',
			'revise_belief',
			'inspect_codex_item',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(deferBeliefsPendingOutcomesSkill, DIRECT_API_NAMES);
	});

	it('simulates: remember → defer → confirm after expiry', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'New API will reduce latency by 40%',
				source: 'inferred',
				category: 'capability',
			}),
		);

		const futureDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
		const deferred = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'defer',
				beliefId: rem.data.belief.id,
				deferredUntil: futureDate,
			}),
		);
		ok(deferred.ok);

		const detail = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: rem.data.belief.id }));
		ok(detail.data.detail.deferredUntil !== null);

		const confirmed = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'confirm', beliefId: rem.data.belief.id }),
		);
		ok(confirmed.ok);
	});

	it('requires deferredUntil for defer action', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Quarterly results pending',
				source: 'inferred',
				category: 'fact',
			}),
		);
		const result = expectClarification(
			reviseBeliefToolHandler(db, { action: 'defer', beliefId: rem.data.belief.id }),
		);
		ok(result.clarification.missing.includes('deferredUntil'));
	});
});
