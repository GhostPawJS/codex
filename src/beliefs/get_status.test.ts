import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { confirmBelief } from './confirm_belief.ts';
import { correctBelief } from './correct_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { getStatus } from './get_status.ts';
import { remember } from './remember.ts';

describe('getStatus', () => {
	it('summarizes active belief state', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses GraphQL', source: 'explicit', category: 'fact' }, { now: 1 });
		const status = getStatus(db, 1);
		strictEqual(status.activeBeliefCount, 1);
		strictEqual(status.totalBeliefCount, 1);
	});

	it('provides certainty and evidence distributions', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'High certainty fact', source: 'explicit', category: 'fact', certainty: 0.95 },
			{ now: 1 },
		);
		remember(
			db,
			{ claim: 'Medium certainty', source: 'observed', category: 'preference', certainty: 0.6 },
			{ now: 2 },
		);
		remember(
			db,
			{ claim: 'Low certainty', source: 'inferred', category: 'fact', certainty: 0.2 },
			{ now: 3 },
		);
		confirmBelief(db, 1, { now: 4 });
		confirmBelief(db, 1, { now: 5 });
		confirmBelief(db, 1, { now: 6 });
		confirmBelief(db, 1, { now: 7 });

		const status = getStatus(db, 10);
		deepStrictEqual(status.certaintyDistribution, {
			veryLow: 1,
			low: 0,
			moderate: 1,
			high: 0,
			veryHigh: 1,
		});
		deepStrictEqual(status.evidenceDistribution, {
			single: 2,
			few: 0,
			moderate: 1,
			strong: 0,
		});
	});

	it('returns zero distributions for empty codex', async () => {
		const db = await createInitializedCodexDb();
		const status = getStatus(db, 1);
		strictEqual(status.activeBeliefCount, 0);
		deepStrictEqual(status.certaintyDistribution, {
			veryLow: 0,
			low: 0,
			moderate: 0,
			high: 0,
			veryHigh: 0,
		});
		deepStrictEqual(status.evidenceDistribution, {
			single: 0,
			few: 0,
			moderate: 0,
			strong: 0,
		});
	});

	it('totalBeliefCount includes superseded beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old fact', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'New fact' }, { now: 2 });
		const status = getStatus(db, 10);
		strictEqual(status.activeBeliefCount, 1);
		strictEqual(status.totalBeliefCount, 2);
	});

	it('integrity reflects the percentage of strong beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'Strong one', source: 'explicit', category: 'fact', certainty: 0.9 },
			{ now: 1 },
		);
		remember(
			db,
			{ claim: 'Weak one', source: 'inferred', category: 'fact', certainty: 0.3 },
			{ now: 2 },
		);
		const status = getStatus(db, 10);
		strictEqual(status.integrity, 50);
	});

	it('integrity is 0 when all beliefs are faint', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'Faint', source: 'inferred', category: 'fact', certainty: 0.2 },
			{ now: 1 },
		);
		const status = getStatus(db, 10);
		strictEqual(status.integrity, 0);
	});

	it('tracks source and category breakdowns correctly', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'observed', category: 'preference' }, { now: 2 });
		remember(db, { claim: 'C', source: 'inferred', category: 'procedure' }, { now: 3 });
		const status = getStatus(db, 10);
		strictEqual(status.sourceCounts.explicit, 1);
		strictEqual(status.sourceCounts.observed, 1);
		strictEqual(status.sourceCounts.inferred, 1);
		strictEqual(status.sourceCounts.distilled, 0);
		strictEqual(status.categoryCounts.fact, 1);
		strictEqual(status.categoryCounts.preference, 1);
		strictEqual(status.categoryCounts.procedure, 1);
	});

	it('does not count forgotten beliefs as active', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Active', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'Forgotten', source: 'explicit', category: 'fact' }, { now: 2 });
		forgetBelief(db, 2, { now: 3 });
		const status = getStatus(db, 10);
		strictEqual(status.activeBeliefCount, 1);
		strictEqual(status.totalBeliefCount, 2);
	});
});
