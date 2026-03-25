import { notStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { correctBeliefLineageHonestlySkill } from './correct-belief-lineage-honestly.ts';
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

describe('correct-belief-lineage-honestly skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(correctBeliefLineageHonestlySkill, [
			'inspect_codex_item',
			'revise_belief',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(correctBeliefLineageHonestlySkill, DIRECT_API_NAMES);
	});

	it('simulates: inspect → correct → verify lineage', async () => {
		const db = await createSkillTestDb();
		const orig = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Default branch is master',
				source: 'observed',
				category: 'fact',
			}),
		);

		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: orig.data.belief.id }));

		const corrected = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'correct',
				beliefId: orig.data.belief.id,
				claim: 'Default branch is main',
			}),
		);
		ok(corrected.ok);

		const newId = (corrected.data as Record<string, unknown>).belief;
		ok(newId !== undefined);
		const newBeliefId = (newId as Record<string, unknown>).id as number;

		const inspectNew = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: newBeliefId }));
		strictEqual(inspectNew.data.detail.claim, 'Default branch is main');
		ok(inspectNew.data.lineage.length >= 2);

		const inspectOld = expectSuccess(
			inspectCodexItemToolHandler(db, { beliefId: orig.data.belief.id }),
		);
		notStrictEqual(inspectOld.data.detail.supersededBy, null);
	});
});
