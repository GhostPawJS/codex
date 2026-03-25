import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { diagnoseDecliningIntegritySkill } from './diagnose-declining-integrity.ts';
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

describe('diagnose-declining-integrity skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(diagnoseDecliningIntegritySkill, [
			'review_codex',
			'inspect_codex_item',
			'revise_belief',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(diagnoseDecliningIntegritySkill, DIRECT_API_NAMES);
	});

	it('simulates: status → flags → trends → batch fix → re-check', async () => {
		const db = await createSkillTestDb();
		const beliefs = [
			{
				claim: 'Memory usage is below 512MB',
				source: 'inferred' as const,
				category: 'fact' as const,
			},
			{ claim: 'CPU stays under 70%', source: 'inferred' as const, category: 'fact' as const },
			{
				claim: 'Latency p99 is under 100ms',
				source: 'inferred' as const,
				category: 'capability' as const,
			},
		];
		const ids: number[] = [];
		for (const b of beliefs) {
			const rem = expectSuccess(rememberBeliefToolHandler(db, b));
			ids.push(rem.data.belief.id);
		}

		const status = expectSuccess(reviewCodexToolHandler(db, { view: 'status' }));
		ok(status.data.payload.view === 'status');

		const farFuture = Date.now() + 365 * 24 * 60 * 60 * 1000;
		const flags = expectSuccess(reviewCodexToolHandler(db, { view: 'flags', now: farFuture }));
		ok(flags.data.payload.view === 'flags');

		const trends = expectSuccess(reviewCodexToolHandler(db, { view: 'trends' }));
		ok(trends.data.payload.view === 'trends');

		for (const id of ids) {
			expectSuccess(inspectCodexItemToolHandler(db, { beliefId: id }));
			expectSuccess(reviseBeliefToolHandler(db, { action: 'confirm', beliefId: id }));
		}

		const status2 = expectSuccess(reviewCodexToolHandler(db, { view: 'status' }));
		ok(status2.data.payload.view === 'status');
	});
});
