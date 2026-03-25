import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectCodexItemToolHandler } from '../tools/inspect_codex_item_tool.ts';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { searchCodexToolHandler } from '../tools/search_codex_tool.ts';
import { searchAndRetrieveBeliefsSkill } from './search-and-retrieve-beliefs.ts';
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

describe('search-and-retrieve-beliefs skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(searchAndRetrieveBeliefsSkill, [
			'search_codex',
			'inspect_codex_item',
			'review_codex',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(searchAndRetrieveBeliefsSkill, DIRECT_API_NAMES);
	});

	it('simulates: search → inspect → review status', async () => {
		const db = await createSkillTestDb();

		rememberBeliefToolHandler(db, {
			claim: 'TypeScript is a superset of JavaScript',
			source: 'explicit',
			category: 'fact',
		});
		rememberBeliefToolHandler(db, {
			claim: 'Biome replaces ESLint and Prettier',
			source: 'observed',
			category: 'fact',
		});

		const searchResult = expectSuccess(
			searchCodexToolHandler(db, { query: 'TypeScript', minScore: 0 }),
		);
		ok(searchResult.data.results.length >= 1);
		const topId = searchResult.data.results[0]?.id;
		ok(topId !== undefined);

		const inspectResult = expectSuccess(inspectCodexItemToolHandler(db, { beliefId: topId }));
		ok(inspectResult.data.detail.claim.includes('TypeScript'));

		const statusResult = expectSuccess(reviewCodexToolHandler(db, { view: 'status' }));
		ok(statusResult.data.payload.view === 'status');
	});

	it('handles empty codex with empty_result warning', async () => {
		const db = await createSkillTestDb();
		const result = expectSuccess(searchCodexToolHandler(db, { query: 'anything' }));
		ok(result.warnings?.some((w) => w.code === 'empty_result'));
	});

	it('returns not_found for inspect on nonexistent belief', async () => {
		const db = await createSkillTestDb();
		const result = expectError(inspectCodexItemToolHandler(db, { beliefId: 9999 }));
		strictEqual(result.error.code, 'not_found');
	});
});
