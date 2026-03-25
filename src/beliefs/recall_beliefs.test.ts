import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { correctBelief } from './correct_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { recall } from './recall_beliefs.ts';
import { remember } from './remember.ts';

describe('recall', () => {
	it('returns ranked active beliefs for a query', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'The API uses GraphQL', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		remember(db, { claim: 'The API uses REST', source: 'explicit', category: 'fact' }, { now: 2 });
		const results = recall(db, 'GraphQL API', { now: 10, minScore: 0 });
		strictEqual(results.length >= 1, true);
		strictEqual(results[0]?.claim.includes('GraphQL'), true);
	});

	it('returns empty array for empty query', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Some belief', source: 'explicit', category: 'fact' }, { now: 1 });
		const results = recall(db, '', { now: 10 });
		strictEqual(results.length, 0);
	});

	it('returns empty array for whitespace-only query', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Some belief', source: 'explicit', category: 'fact' }, { now: 1 });
		const results = recall(db, '   ', { now: 10 });
		strictEqual(results.length, 0);
	});

	it('returns empty array for empty codex', async () => {
		const db = await createInitializedCodexDb();
		const results = recall(db, 'anything', { now: 10 });
		strictEqual(results.length, 0);
	});

	it('excludes superseded beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old REST API', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'New GraphQL API' }, { now: 2 });
		const results = recall(db, 'REST', { now: 10, minScore: 0 });
		for (const r of results) {
			strictEqual(r.isActive, true);
		}
	});

	it('filters by category when specified', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'TypeScript types', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(
			db,
			{ claim: 'TypeScript preferred', source: 'explicit', category: 'preference' },
			{ now: 2 },
		);
		const results = recall(db, 'TypeScript', { now: 10, minScore: 0, category: 'preference' });
		for (const r of results) {
			strictEqual(r.category, 'preference');
		}
	});

	it('filters by source when specified', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Explicit fact', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'Inferred fact', source: 'inferred', category: 'fact' }, { now: 2 });
		const results = recall(db, 'fact', { now: 10, minScore: 0, source: 'inferred' });
		for (const r of results) {
			strictEqual(r.source, 'inferred');
		}
	});

	it('respects limit parameter', async () => {
		const db = await createInitializedCodexDb();
		for (let i = 0; i < 10; i++) {
			remember(
				db,
				{ claim: `Belief about testing ${i}`, source: 'explicit', category: 'fact' },
				{ now: i + 1 },
			);
		}
		const results = recall(db, 'testing', { now: 100, minScore: 0, limit: 3 });
		strictEqual(results.length <= 3, true);
	});

	it('excludes forgotten beliefs from results', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Forgotten thing', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		const results = recall(db, 'forgotten', { now: 10, minScore: 0 });
		strictEqual(results.length, 0);
	});

	it('includes scoreParts with transparency metadata', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'GraphQL is the primary API', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const results = recall(db, 'GraphQL', { now: 10, minScore: 0 });
		if (results.length > 0) {
			const parts = results[0]?.scoreParts;
			strictEqual(parts !== undefined, true);
			strictEqual(typeof parts?.finalScore, 'number');
			strictEqual(typeof parts?.recallWeight, 'number');
		}
	});
});
