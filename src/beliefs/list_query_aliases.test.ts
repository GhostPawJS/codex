import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { addQueryAlias } from './add_query_alias.ts';
import { listQueryAliases } from './list_query_aliases.ts';

test('list_query_aliases behavior', async () => {
	const db = await createInitializedCodexDb();
	try {
		assert.deepEqual(listQueryAliases(db), []);
		for (const [term, alias] of [
			['z', 'b'],
			['a', 'z'],
			['a', 'b'],
		] as const)
			addQueryAlias(db, term, alias, { now: 7 });
		assert.deepEqual(listQueryAliases(db), [
			{ term: 'a', alias: 'b', createdAt: 7 },
			{ term: 'a', alias: 'z', createdAt: 7 },
			{ term: 'z', alias: 'b', createdAt: 7 },
		] as const);
	} finally {
		db.close();
	}
});
