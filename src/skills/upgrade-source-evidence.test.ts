import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';
import { upgradeSourceEvidenceSkill } from './upgrade-source-evidence.ts';

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

describe('upgrade-source-evidence skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(upgradeSourceEvidenceSkill, ['inspect_codex_item', 'revise_belief']);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(upgradeSourceEvidenceSkill, DIRECT_API_NAMES);
	});

	it('simulates: inferred → observed source upgrade via correct', async () => {
		const db = await createSkillTestDb();
		const orig = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Application handles 1000 RPS',
				source: 'inferred',
				category: 'capability',
			}),
		);

		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: orig.data.belief.id }));

		const corrected = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'correct',
				beliefId: orig.data.belief.id,
				claim: 'Application handles 1000 RPS',
				source: 'observed',
				certainty: 0.85,
			}),
		);
		ok(corrected.ok);

		const newId = ((corrected.data as Record<string, unknown>).belief as Record<string, unknown>)
			.id as number;
		const detail = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: newId }));
		strictEqual(detail.data.detail.source, 'observed');
		ok(detail.data.detail.versionDiff !== null);
		ok(detail.data.lineage.length >= 2);
	});
});
