import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { correctBelief } from './correct_belief.ts';
import { getTrends } from './get_trends.ts';
import { mergeBeliefs } from './merge_beliefs.ts';
import { remember } from './remember.ts';

describe('getTrends', () => {
	it('reports growing categories and calibration alerts', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'API uses REST', source: 'explicit', category: 'fact', certainty: 0.95 },
			{ now: 1 },
		);
		correctBelief(db, 1, { claim: 'API uses GraphQL' }, { now: 2 });
		const trends = getTrends(db);
		strictEqual(trends.revisedHighCertaintyCount, 1);
	});

	it('detects repeatedly revised beliefs (instability)', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		remember(db, { claim: 'C', source: 'explicit', category: 'fact' }, { now: 3 });
		const merged = mergeBeliefs(db, { beliefIds: [1, 2, 3], claim: 'ABC combined' }, { now: 10 });
		strictEqual(merged.isActive, true);
		const trends = getTrends(db);
		strictEqual(trends.repeatedlyRevisedCount, 1);
	});

	it('returns zero instability for fresh codex', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Only one', source: 'explicit', category: 'fact' }, { now: 1 });
		const trends = getTrends(db);
		strictEqual(trends.repeatedlyRevisedCount, 0);
	});
});
