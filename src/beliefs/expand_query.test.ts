import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { addQueryAlias } from './add_query_alias.ts';
import { expandQuery } from './expand_query.ts';

test('expand_query behavior', async () => {
	const db = await createInitializedCodexDb();
	try {
		assert.equal(expandQuery(db, 'What CLASS?'), 'What CLASS?');
		addQueryAlias(db, 'class', 'warrior');
		addQueryAlias(db, 'warrior', 'fighter');
		addQueryAlias(db, 'role', 'warrior');
		assert.equal(expandQuery(db, 'CLASS class role'), 'CLASS class role warrior');
		assert.equal(expandQuery(db, 'fighter'), 'fighter');
		assert.equal(expandQuery(db, 'class warrior'), 'class warrior fighter');
	} finally {
		db.close();
	}
});
