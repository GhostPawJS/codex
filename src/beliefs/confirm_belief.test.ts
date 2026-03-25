import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { confirmBelief } from './confirm_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { remember } from './remember.ts';

describe('confirmBelief', () => {
	it('increments evidence and refreshes verification time', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'explicit', category: 'fact' }, { now: 10 });
		const record = confirmBelief(db, 1, { now: 20 });
		strictEqual(record.evidence, 2);
		strictEqual(record.verifiedAt, 20);
	});

	it('applies EMA to certainty with max cap', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'Stable fact', source: 'explicit', category: 'fact', certainty: 0.98 },
			{ now: 1 },
		);
		const record = confirmBelief(db, 1, { now: 2 });
		strictEqual(record.certainty <= 0.99, true);
		strictEqual(record.certainty > 0.98, true);
	});

	it('throws on nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		throws(() => confirmBelief(db, 999, { now: 1 }), /not found/i);
	});

	it('throws on superseded belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		throws(() => confirmBelief(db, 1, { now: 3 }), /not found/i);
	});

	it('converges certainty toward ceiling over many confirmations', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Repeated fact', source: 'inferred', category: 'fact' }, { now: 1 });
		let record = confirmBelief(db, 1, { now: 2 });
		for (let i = 3; i <= 20; i++) {
			record = confirmBelief(db, 1, { now: i });
		}
		strictEqual(record.certainty, 0.99);
		strictEqual(record.evidence, 20);
	});
});
