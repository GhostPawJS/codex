import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { confirmBelief } from './confirm_belief.ts';
import { correctBelief } from './correct_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { listLog } from './list_log.ts';
import { mergeBeliefs } from './merge_beliefs.ts';
import { remember } from './remember.ts';

describe('listLog', () => {
	it('shows remembered entries', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'explicit', category: 'fact' }, { now: 1 });
		const log = listLog(db);
		strictEqual(log[0]?.type, 'remembered');
	});

	it('shows confirmed entries', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'explicit', category: 'fact' }, { now: 1 });
		confirmBelief(db, 1, { now: 2 });
		const log = listLog(db);
		strictEqual(log[0]?.type, 'confirmed');
	});

	it('shows revised entries for corrections', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'API uses GraphQL' }, { now: 2 });
		const log = listLog(db);
		const original = log.find((entry) => entry.claim === 'API uses REST');
		strictEqual(original?.type, 'revised');
	});

	it('shows forgotten entries for self-superseded beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Obsolete fact', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		const log = listLog(db);
		const forgotten = log.find((entry) => entry.claim === 'Obsolete fact');
		strictEqual(forgotten?.type, 'forgotten');
	});

	it('shows merged entries when multiple beliefs point to the same successor', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		mergeBeliefs(db, { beliefIds: [1, 2], claim: 'A+B' }, { now: 3 });
		const log = listLog(db);
		const mergedEntries = log.filter((entry) => entry.type === 'merged');
		strictEqual(mergedEntries.length, 2);
	});

	it('respects limit parameter', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'First', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'Second', source: 'explicit', category: 'fact' }, { now: 2 });
		remember(db, { claim: 'Third', source: 'explicit', category: 'fact' }, { now: 3 });
		const log = listLog(db, 2);
		strictEqual(log.length, 2);
	});
});
