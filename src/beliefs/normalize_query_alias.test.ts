import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CodexValidationError } from '../errors.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { normalizeQueryAlias } from './normalize_query_alias.ts';

test('normalize_query_alias behavior', async () => {
	const db = await createInitializedCodexDb();
	try {
		assert.deepEqual(normalizeQueryAlias(' Class! ', 'Warrior'), ['class', 'warrior']);
		assert.throws(() => normalizeQueryAlias('two words', 'x'), CodexValidationError);
	} finally {
		db.close();
	}
});
