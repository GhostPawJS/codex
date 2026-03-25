import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { retireBeliefToolHandler } from '../tools/retire_belief_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { eraseBeliefsForPrivacySkill } from './erase-beliefs-for-privacy.ts';
import {
	createSkillTestDb,
	expectError,
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

describe('erase-beliefs-for-privacy skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(eraseBeliefsForPrivacySkill, [
			'inspect_codex_item',
			'revise_belief',
			'retire_belief',
			'review_codex',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(eraseBeliefsForPrivacySkill, DIRECT_API_NAMES);
	});

	it('simulates: soft removal via forget', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'User email is alice@example.com',
				source: 'explicit',
				category: 'fact',
			}),
		);

		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: rem.data.belief.id }));

		const forgotten = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'forget', beliefId: rem.data.belief.id }),
		);
		ok(forgotten.ok);

		const detail = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: rem.data.belief.id }));
		strictEqual(detail.data.detail.isActive, false);
	});

	it('simulates: hard erasure via retire', async () => {
		const db = await createSkillTestDb();
		const rem = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'User SSN is 123-45-6789',
				source: 'explicit',
				category: 'fact',
			}),
		);

		const retired = expectSuccess(retireBeliefToolHandler(db, { beliefId: rem.data.belief.id }));
		ok(retired.data.deletedIds.length >= 1);
		ok(retired.data.deletedIds.includes(rem.data.belief.id));

		const inspectResult = expectError(
			inspectCodexItemToolHandler(db, { beliefId: rem.data.belief.id }),
		);
		strictEqual(inspectResult.error.code, 'not_found');
	});

	it('simulates: hard erasure includes lineage chain', async () => {
		const db = await createSkillTestDb();
		const orig = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'User phone is 555-0100',
				source: 'explicit',
				category: 'fact',
			}),
		);
		const corrected = expectSuccess(
			reviseBeliefToolHandler(db, {
				action: 'correct',
				beliefId: orig.data.belief.id,
				claim: 'User phone is 555-0200',
			}),
		);
		const newId = ((corrected.data as Record<string, unknown>).belief as Record<string, unknown>)
			.id as number;

		const retired = expectSuccess(retireBeliefToolHandler(db, { beliefId: newId }));
		ok(retired.data.deletedIds.length >= 2);
		ok(retired.data.deletedIds.includes(orig.data.belief.id));
		ok(retired.data.deletedIds.includes(newId));
	});
});
