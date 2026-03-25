import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dismissProximityToolHandler } from '../tools/dismiss_proximity_tool.ts';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { dismissFalseProximityPairsSkill } from './dismiss-false-proximity-pairs.ts';
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

describe('dismiss-false-proximity-pairs skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(dismissFalseProximityPairsSkill, [
			'inspect_codex_item',
			'dismiss_proximity',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(dismissFalseProximityPairsSkill, DIRECT_API_NAMES);
	});

	it('simulates: inspect → dismiss → verify exponential backoff', async () => {
		const db = await createSkillTestDb();
		const a = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Kubernetes uses etcd for state',
				source: 'explicit',
				category: 'fact',
			}),
		);
		const b = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'Docker uses containerd runtime',
				source: 'explicit',
				category: 'fact',
			}),
		);

		expectSuccess(inspectCodexItemToolHandler(db, { beliefId: a.data.belief.id }));

		const first = expectSuccess(
			dismissProximityToolHandler(db, {
				beliefA: a.data.belief.id,
				beliefB: b.data.belief.id,
			}),
		);
		strictEqual(first.data.dismissal.dismissCount, 1);

		const second = expectSuccess(
			dismissProximityToolHandler(db, {
				beliefA: a.data.belief.id,
				beliefB: b.data.belief.id,
			}),
		);
		strictEqual(second.data.dismissal.dismissCount, 2);
		ok(second.data.dismissal.resurfaceAfter > first.data.dismissal.resurfaceAfter);
	});
});
