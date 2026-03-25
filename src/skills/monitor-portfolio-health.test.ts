import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { monitorPortfolioHealthSkill } from './monitor-portfolio-health.ts';
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

describe('monitor-portfolio-health skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(monitorPortfolioHealthSkill, ['review_codex', 'inspect_codex_item']);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(monitorPortfolioHealthSkill, DIRECT_API_NAMES);
	});

	it('simulates: status → trends → flags check', async () => {
		const db = await createSkillTestDb();
		rememberBeliefToolHandler(db, {
			claim: 'System uptime is 99.9%',
			source: 'observed',
			category: 'fact',
		});
		rememberBeliefToolHandler(db, {
			claim: 'Backup runs every 6 hours',
			source: 'explicit',
			category: 'procedure',
		});

		const status = expectSuccess(reviewCodexToolHandler(db, { view: 'status' }));
		ok(status.data.payload.view === 'status');

		const trends = expectSuccess(reviewCodexToolHandler(db, { view: 'trends' }));
		ok(trends.data.payload.view === 'trends');

		const flags = expectSuccess(reviewCodexToolHandler(db, { view: 'flags' }));
		ok(flags.data.payload.view === 'flags');
	});

	it('works on empty codex', async () => {
		const db = await createSkillTestDb();
		const status = expectSuccess(reviewCodexToolHandler(db, { view: 'status' }));
		ok(status.data.payload.view === 'status');

		const trends = expectSuccess(reviewCodexToolHandler(db, { view: 'trends' }));
		ok(trends.data.payload.view === 'trends');
	});
});
