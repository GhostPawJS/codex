import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { forgetBelief } from './forget_belief.ts';
import { getActiveBeliefRow } from './get_active_belief_row.ts';
import { mergeBeliefs } from './merge_beliefs.ts';
import { remember } from './remember.ts';

describe('mergeBeliefs', () => {
	it('creates a merged successor when no successor is supplied', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(
			db,
			{ claim: 'REST is the current API shape', source: 'observed', category: 'fact' },
			{ now: 2 },
		);
		const record = mergeBeliefs(
			db,
			{ beliefIds: [1, 2], claim: 'API currently uses REST' },
			{ now: 3 },
		);
		strictEqual(record.id > 2, true);
		strictEqual(getActiveBeliefRow(db, 1), null);
	});

	it('uses an existing successor when successorId is provided', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		remember(db, { claim: 'Winner', source: 'explicit', category: 'fact' }, { now: 3 });
		const record = mergeBeliefs(db, { beliefIds: [1, 2], successorId: 3 }, { now: 4 });
		strictEqual(record.id, 3);
		strictEqual(getActiveBeliefRow(db, 1), null);
		strictEqual(getActiveBeliefRow(db, 2), null);
	});

	it('rejects single-belief merges', async () => {
		const db = await createInitializedCodexDb();
		throws(() => mergeBeliefs(db, { beliefIds: [1] }), /at least two distinct/i);
	});

	it('rejects empty belief list', async () => {
		const db = await createInitializedCodexDb();
		throws(() => mergeBeliefs(db, { beliefIds: [] }), /at least two distinct/i);
	});

	it('deduplicates IDs', async () => {
		const db = await createInitializedCodexDb();
		throws(() => mergeBeliefs(db, { beliefIds: [1, 1, 1] }), /at least two distinct/i);
	});

	it('throws when a belief in the list does not exist', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Only one', source: 'explicit', category: 'fact' }, { now: 1 });
		throws(
			() => mergeBeliefs(db, { beliefIds: [1, 999], claim: 'Merged' }, { now: 2 }),
			/not found/i,
		);
	});

	it('throws when a belief in the list is superseded', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		forgetBelief(db, 1, { now: 3 });
		throws(
			() => mergeBeliefs(db, { beliefIds: [1, 2], claim: 'Merged' }, { now: 4 }),
			/not found/i,
		);
	});

	it('auto-generates a claim by joining when none is provided', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Alpha', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'Beta', source: 'explicit', category: 'fact' }, { now: 2 });
		const record = mergeBeliefs(db, { beliefIds: [1, 2] }, { now: 3 });
		strictEqual(record.claim.includes('Alpha'), true);
		strictEqual(record.claim.includes('Beta'), true);
	});

	it('handles successorId being one of the beliefIds', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Winner', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'Loser', source: 'explicit', category: 'fact' }, { now: 2 });
		const record = mergeBeliefs(db, { beliefIds: [1, 2], successorId: 1 }, { now: 3 });
		strictEqual(record.id, 1);
		strictEqual(getActiveBeliefRow(db, 2), null);
	});
});
