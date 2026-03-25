import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dismissProximityToolHandler } from '../tools/dismiss_proximity_tool.ts';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { reviewFlagsBatchSkill } from './review-flags-batch.ts';
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

describe('review-flags-batch skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(reviewFlagsBatchSkill, [
			'review_codex',
			'inspect_codex_item',
			'revise_belief',
			'dismiss_proximity',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(reviewFlagsBatchSkill, DIRECT_API_NAMES);
	});

	it('simulates: load flags → inspect → confirm stale belief', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Redis default port is 6379',
				source: 'explicit',
				category: 'fact',
			}),
		);

		const farFuture = Date.now() + 365 * 24 * 60 * 60 * 1000;
		const flags = expectSuccess(reviewCodexToolHandler(db, { view: 'flags', now: farFuture }));
		ok(flags.data.payload.view === 'flags');

		const detail = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: rem.data.belief.id }));
		ok(detail.data.detail.claim.includes('Redis'));

		const confirmed = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'confirm', beliefId: rem.data.belief.id }),
		);
		ok(confirmed.ok);
	});

	it('simulates: dismiss false proximity during flag review', async () => {
		const db = await createSkillTestDb();
		const a = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Python is dynamically typed',
				source: 'explicit',
				category: 'fact',
			}),
		);
		const b = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'TypeScript is statically typed',
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
		ok(dismissed.data.dismissal.dismissCount >= 1);
	});
});
