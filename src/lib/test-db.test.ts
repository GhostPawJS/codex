import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from './open-test-database.ts';
import { createInitializedCodexDb } from './test-db.ts';

describe('createInitializedCodexDb', () => {
	it('returns a usable initialized database', async () => {
		const db = await createInitializedCodexDb();
		const row = db.prepare('SELECT 1 AS ok FROM beliefs LIMIT 1').get();
		strictEqual(Number(row?.ok ?? 1), 1);
	});

	it('differs from a bare openTestDatabase with no schema', async () => {
		const bare = await openTestDatabase();
		throws(() => {
			bare.prepare('SELECT 1 FROM beliefs').get();
		}, /no such table/i);
	});
});
