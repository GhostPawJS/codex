import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { forgetBelief } from './forget_belief.ts';
import { getActiveBeliefRow } from './get_active_belief_row.ts';
import { remember } from './remember.ts';

describe('forgetBelief', () => {
	it('self-supersedes a belief when no successor is provided', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Temporary note', source: 'explicit', category: 'fact' }, { now: 1 });
		const record = forgetBelief(db, 1, { now: 2 });
		strictEqual(record.supersededBy, 1);
		strictEqual(getActiveBeliefRow(db, 1), null);
	});

	it('directs supersession to a specific successor', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old fact', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'Better fact', source: 'explicit', category: 'fact' }, { now: 2 });
		const record = forgetBelief(db, 1, { successorId: 2, now: 3 });
		strictEqual(record.supersededBy, 2);
		strictEqual(getActiveBeliefRow(db, 1), null);
	});

	it('throws on nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		throws(() => forgetBelief(db, 999, { now: 1 }), /not found/i);
	});

	it('throws on already-superseded belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Gone', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		throws(() => forgetBelief(db, 1, { now: 3 }), /not found/i);
	});

	it('throws when successor does not exist', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Exists', source: 'explicit', category: 'fact' }, { now: 1 });
		throws(() => forgetBelief(db, 1, { successorId: 999, now: 2 }), /not found/i);
	});

	it('throws when successor is itself superseded', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		forgetBelief(db, 2, { now: 3 });
		throws(() => forgetBelief(db, 1, { successorId: 2, now: 4 }), /not found/i);
	});

	it('preserves the forgotten belief in the database for lineage', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Preserved', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		const row = db.prepare('SELECT * FROM beliefs WHERE id = 1').get();
		strictEqual(row !== undefined, true);
	});
});
