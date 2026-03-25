import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { recordDismissal } from '../dismissals/record_dismissal.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { correctBelief } from './correct_belief.ts';
import { deleteBelief } from './delete_belief.ts';
import { remember } from './remember.ts';

describe('deleteBelief', () => {
	it('deletes a belief and its lineage component', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'REST', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'GraphQL' }, { now: 2 });
		deepStrictEqual(deleteBelief(db, 1), [1, 2]);
	});

	it('returns empty array for nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		deepStrictEqual(deleteBelief(db, 999), []);
	});

	it('deletes a standalone belief with no lineage', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Solo', source: 'explicit', category: 'fact' }, { now: 1 });
		deepStrictEqual(deleteBelief(db, 1), [1]);
		const remaining = db.prepare('SELECT COUNT(*) AS count FROM beliefs').get()?.count;
		strictEqual(Number(remaining), 0);
	});

	it('cleans up associated dismissals', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		remember(db, { claim: 'C', source: 'explicit', category: 'fact' }, { now: 3 });
		recordDismissal(db, 1, 2, 10);
		recordDismissal(db, 1, 3, 10);
		deleteBelief(db, 1);
		const dismissalCount = Number(
			db.prepare('SELECT COUNT(*) AS count FROM dismissals').get()?.count ?? 0,
		);
		strictEqual(dismissalCount, 0);
	});

	it('does not affect unrelated beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Target', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'Bystander', source: 'explicit', category: 'fact' }, { now: 2 });
		deleteBelief(db, 1);
		const remaining = db.prepare('SELECT COUNT(*) AS count FROM beliefs').get()?.count;
		strictEqual(Number(remaining), 1);
	});
});
