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

	it('does not count merge fan-in as repeated correction', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		remember(db, { claim: 'C', source: 'explicit', category: 'fact' }, { now: 3 });
		const merged = mergeBeliefs(db, { beliefIds: [1, 2, 3], claim: 'ABC combined' }, { now: 10 });
		strictEqual(merged.isActive, true);
		const trends = getTrends(db);
		strictEqual(trends.repeatedlyRevisedCount, 0);
	});

	it('returns zero instability for fresh codex', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Only one', source: 'explicit', category: 'fact' }, { now: 1 });
		const trends = getTrends(db);
		strictEqual(trends.repeatedlyRevisedCount, 0);
	});
});

it('counts corrections rather than merges or forgetting in calibration and repeated revision', async () => {
	const db = await createInitializedCodexDb();
	for (const claim of ['First', 'Second', 'Winner'])
		remember(db, { claim, source: 'explicit', category: 'fact', certainty: 0.9 }, { now: 1 });
	mergeBeliefs(db, { beliefIds: [1], successorId: 3 }, { now: 2 });
	mergeBeliefs(db, { beliefIds: [2, 3] }, { now: 3 });
	strictEqual(getTrends(db).revisedHighCertaintyCount, 0);
	strictEqual(getTrends(db).calibrationAlerts.length, 0);
	const corrected = correctBelief(db, 4, { claim: 'New understanding' }, { now: 4 });
	strictEqual(getTrends(db).revisedHighCertaintyCount, 1);
	correctBelief(db, corrected.id, { claim: 'Further correction' }, { now: 5 });
	strictEqual(getTrends(db).repeatedlyRevisedCount, 1);
	db.close();
});
