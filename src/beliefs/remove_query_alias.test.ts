import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CodexValidationError } from '../errors.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { addQueryAlias } from './add_query_alias.ts';
import { removeQueryAlias } from './remove_query_alias.ts';

test('remove_query_alias behavior', async () => {
	const db = await createInitializedCodexDb();
	try {
		addQueryAlias(db, 'class', 'warrior');
		assert.equal(removeQueryAlias(db, 'CLASS!', 'Warrior'), true);
		assert.equal(removeQueryAlias(db, 'class', 'warrior'), false);
		assert.throws(() => removeQueryAlias(db, 'x', 'x'), CodexValidationError);
	} finally {
		db.close();
	}
});
