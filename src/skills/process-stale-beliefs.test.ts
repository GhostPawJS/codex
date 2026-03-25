import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { processStaleBeliefsSkill } from './process-stale-beliefs.ts';
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

describe('process-stale-beliefs skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(processStaleBeliefsSkill, [
			'review_codex',
			'inspect_codex_item',
			'revise_belief',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(processStaleBeliefsSkill, DIRECT_API_NAMES);
	});

	it('simulates: load flags at future time → inspect → confirm', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Deno supports npm packages',
				source: 'observed',
				category: 'capability',
			}),
		);

		const farFuture = Date.now() + 365 * 24 * 60 * 60 * 1000;
		const flags = expectSuccess(reviewCodexToolHandler(db, { view: 'flags', now: farFuture }));
		ok(flags.data.payload.view === 'flags');

		const detail = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: rem.data.belief.id }));
		ok(detail.data.detail.isActive);

		const confirmed = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'confirm', beliefId: rem.data.belief.id }),
		);
		ok(confirmed.ok);

		const status = expectSuccess(reviewCodexToolHandler(db, { view: 'status' }));
		ok(status.data.payload.view === 'status');
	});

	it('simulates: forget an irrelevant stale belief', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Team uses Slack for communication',
				source: 'observed',
				category: 'procedure',
			}),
		);
		const forgotten = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'forget', beliefId: rem.data.belief.id }),
		);
		ok(forgotten.ok);
	});
});
