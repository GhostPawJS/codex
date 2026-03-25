import { ok } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { rememberBeliefToolHandler } from '../tools/remember_belief_tool.ts';
import { reviewCodexToolHandler } from '../tools/review_codex_tool.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { searchCodexToolHandler } from '../tools/search_codex_tool.ts';
import { batchIngestWithDeduplicationSkill } from './batch-ingest-with-deduplication.ts';
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

describe('batch-ingest-with-deduplication skill', () => {
	it('mentions the right tools', () => {
		expectSkillMentionsTools(batchIngestWithDeduplicationSkill, [
			'search_codex',
			'remember_belief',
			'revise_belief',
			'dismiss_proximity',
		]);
	});

	it('avoids direct API references', () => {
		expectSkillAvoidsDirectApi(batchIngestWithDeduplicationSkill, DIRECT_API_NAMES);
	});

	it('simulates: batch of 3 beliefs with search-before-capture', async () => {
		const db = await createSkillTestDb();
		const candidates = [
			{
				claim: 'Go uses goroutines for concurrency',
				source: 'explicit' as const,
				category: 'fact' as const,
			},
			{
				claim: 'Rust has zero-cost abstractions',
				source: 'explicit' as const,
				category: 'fact' as const,
			},
			{
				claim: 'Zig compiles faster than C++',
				source: 'observed' as const,
				category: 'fact' as const,
			},
		];

		for (const candidate of candidates) {
			const search = expectSuccess(
				searchCodexToolHandler(db, { query: candidate.claim, minScore: 0 }),
			);
			if (search.data.results.length === 0) {
				const rem = expectSuccess(rememberBeliefToolHandler(db, candidate));
				ok(rem.data.belief.id > 0);
			}
		}

		const status = expectSuccess(reviewCodexToolHandler(db, { view: 'status' }));
		ok(status.data.payload.view === 'status');
	});

	it('simulates: confirm existing on duplicate during batch', async () => {
		const db = await createSkillTestDb();
		const first = expectSuccess(
			rememberBeliefToolHandler(db, {
				claim: 'SQLite is serverless',
				source: 'explicit',
				category: 'fact',
			}),
		);

		const search = expectSuccess(
			searchCodexToolHandler(db, { query: 'SQLite is serverless', minScore: 0 }),
		);
		ok(search.data.results.length >= 1);

		const confirmed = expectSuccess(
			reviseBeliefToolHandler(db, { action: 'confirm', beliefId: first.data.belief.id }),
		);
		ok(confirmed.ok);
	});
});
