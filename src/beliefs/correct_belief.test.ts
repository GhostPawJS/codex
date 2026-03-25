import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { correctBelief } from './correct_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { getActiveBeliefRow } from './get_active_belief_row.ts';
import { remember } from './remember.ts';

describe('correctBelief', () => {
	it('creates a successor and supersedes the prior belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'explicit', category: 'fact' }, { now: 10 });
		const result = correctBelief(db, 1, { claim: 'API uses GraphQL' }, { now: 20 });
		strictEqual(result.id, 2);
		strictEqual(result.supersededId, 1);
		strictEqual(getActiveBeliefRow(db, 1), null);
	});

	it('returns proximity on the new successor', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'The API uses REST', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(
			db,
			{ claim: 'REST is the current protocol', source: 'observed', category: 'fact' },
			{ now: 2 },
		);
		const result = correctBelief(db, 1, { claim: 'The API uses GraphQL now' }, { now: 3 });
		strictEqual(Array.isArray(result.proximity), true);
	});

	it('skips proximity when skipProximity is true', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = correctBelief(
			db,
			1,
			{ claim: 'API uses GraphQL' },
			{ now: 2, skipProximity: true },
		);
		strictEqual(result.proximity.length, 0);
	});

	it('throws on nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		throws(() => correctBelief(db, 999, { claim: 'New claim' }, { now: 1 }), /not found/i);
	});

	it('throws on already-superseded belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		throws(() => correctBelief(db, 1, { claim: 'New' }, { now: 3 }), /not found/i);
	});

	it('inherits source and category from predecessor when not specified', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Original', source: 'observed', category: 'preference' }, { now: 1 });
		const result = correctBelief(db, 1, { claim: 'Updated' }, { now: 2 });
		strictEqual(result.source, 'observed');
		strictEqual(result.category, 'preference');
	});

	it('allows overriding source and category', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Inferred fact', source: 'inferred', category: 'fact' }, { now: 1 });
		const result = correctBelief(
			db,
			1,
			{ claim: 'Now explicit', source: 'explicit', category: 'procedure' },
			{ now: 2 },
		);
		strictEqual(result.source, 'explicit');
		strictEqual(result.category, 'procedure');
	});
});
