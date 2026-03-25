import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openTestDatabase } from '../lib/open-test-database.ts';
import { initBeliefSearch } from './init_belief_search.ts';
import { initBeliefTables } from './init_belief_tables.ts';

describe('initBeliefSearch', () => {
	it('creates the external content fts table', async () => {
		const db = await openTestDatabase();
		initBeliefTables(db);
		initBeliefSearch(db);
		const row = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'beliefs_fts'")
			.get();
		strictEqual(row?.name, 'beliefs_fts');
	});
});
