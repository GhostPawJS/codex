import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { runCalibrationPassSkill } from './run-calibration-pass.ts';
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

describe('run-calibration-pass skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(runCalibrationPassSkill, ['review_codex', 'inspect_codex_item']);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(runCalibrationPassSkill, DIRECT_API_NAMES);
	});

	it('simulates: load trends → inspect revised belief → check version diff', async () => {
		const db = await createSkillTestDb();
		const orig = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'React renders in 10ms',
				source: 'inferred',
				category: 'capability',
				certainty: 0.95,
			}),
		);

		const corrected = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'correct',
				beliefId: orig.data.belief.id,
				claim: 'React renders in 16ms on average',
				certainty: 0.7,
			}),
		);

		const trends = expectSuccess(reviewCodexToolHandler(db, { view: 'trends' }));
		ok(trends.data.payload.view === 'trends');

		const newBeliefId = (
			(corrected.data as Record<string, unknown>).belief as Record<string, unknown>
		).id as number;
		const detail = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: newBeliefId }));
		ok(detail.data.detail.versionDiff !== null);
	});

	it('trends are available even on an empty codex', async () => {
		const db = await createSkillTestDb();
		const trends = expectSuccess(reviewCodexToolHandler(db, { view: 'trends' }));
		ok(trends.data.payload.view === 'trends');
	});
});
