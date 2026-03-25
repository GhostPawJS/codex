import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { deferBelief } from './defer_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { remember } from './remember.ts';

describe('deferBelief', () => {
	it('sets the deferred-until timestamp for an active belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Need later review', source: 'explicit', category: 'fact' }, { now: 1 });
		const record = deferBelief(db, 1, 100, { now: 2 });
		strictEqual(record.deferredUntil, 100);
	});

	it('throws on nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		throws(() => deferBelief(db, 999, 100, { now: 1 }), /not found/i);
	});

	it('throws on superseded belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Gone', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		throws(() => deferBelief(db, 1, 100, { now: 3 }), /not found/i);
	});

	it('allows deferring with a past timestamp', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Past defer', source: 'explicit', category: 'fact' }, { now: 100 });
		const record = deferBelief(db, 1, 50, { now: 100 });
		strictEqual(record.deferredUntil, 50);
	});

	it('can override a previous deferral', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Deferred', source: 'explicit', category: 'fact' }, { now: 1 });
		deferBelief(db, 1, 100, { now: 2 });
		const record = deferBelief(db, 1, 200, { now: 3 });
		strictEqual(record.deferredUntil, 200);
	});
});
