import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { dismissProximityPair } from './dismiss_proximity_pair.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('dismissProximityPair', () => {
	it('records a public dismissal mutation', async () => {
		const db = await createInitializedCodexDb();
		const record = dismissProximityPair(db, 1, 2, { now: 10 });
		strictEqual(record.dismissCount, 1);
		strictEqual(record.beliefA, 1);
	});

	it('increments dismiss count on repeated dismissals', async () => {
		const db = await createInitializedCodexDb();
		dismissProximityPair(db, 1, 2, { now: 10 });
		const second = dismissProximityPair(db, 1, 2, { now: 20 });
		strictEqual(second.dismissCount, 2);
	});

	it('canonicalizes pair ordering', async () => {
		const db = await createInitializedCodexDb();
		const forward = dismissProximityPair(db, 3, 5, { now: 10 });
		strictEqual(forward.beliefA, 3);
		strictEqual(forward.beliefB, 5);
		const backward = dismissProximityPair(db, 5, 3, { now: 20 });
		strictEqual(backward.beliefA, 3);
		strictEqual(backward.beliefB, 5);
		strictEqual(backward.dismissCount, 2);
	});

	it('throws when both IDs are the same', async () => {
		const db = await createInitializedCodexDb();
		throws(() => dismissProximityPair(db, 1, 1, { now: 10 }), /distinct/i);
	});

	it('applies exponential backoff on resurface time', async () => {
		const db = await createInitializedCodexDb();
		const first = dismissProximityPair(db, 1, 2, { now: 100 });
		strictEqual(first.resurfaceAfter, 100 + 7 * DAY_MS);
		const second = dismissProximityPair(db, 1, 2, { now: 200 });
		strictEqual(second.resurfaceAfter, 200 + 14 * DAY_MS);
		const third = dismissProximityPair(db, 1, 2, { now: 300 });
		strictEqual(third.resurfaceAfter, 300 + 28 * DAY_MS);
	});

	it('caps backoff at 90 days', async () => {
		const db = await createInitializedCodexDb();
		for (let i = 0; i < 10; i++) {
			dismissProximityPair(db, 1, 2, { now: i * 1000 });
		}
		const result = dismissProximityPair(db, 1, 2, { now: 10000 });
		strictEqual(result.resurfaceAfter <= 10000 + 90 * DAY_MS, true);
	});
});
