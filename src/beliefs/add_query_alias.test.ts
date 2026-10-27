import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CodexValidationError } from '../errors.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { addQueryAlias } from './add_query_alias.ts';
import { initBeliefTables } from './init_belief_tables.ts';
import { listQueryAliases } from './list_query_aliases.ts';

test('add_query_alias behavior', async () => {
	const db = await createInitializedCodexDb();
	try {
		initBeliefTables(db);
		addQueryAlias(db, ' Class! ', 'Warrior', { now: 1 });
		addQueryAlias(db, 'class', 'warrior', { now: 2 });
		assert.deepEqual(listQueryAliases(db), [{ term: 'class', alias: 'warrior', createdAt: 1 }]);
		for (const [term, alias] of [
			['', 'x'],
			['two words', 'x'],
			['x', '!!!'],
			['x', 'two words'],
			['X', 'x'],
		] as const)
			assert.throws(() => addQueryAlias(db, term, alias), CodexValidationError);
	} finally {
		db.close();
	}
});
