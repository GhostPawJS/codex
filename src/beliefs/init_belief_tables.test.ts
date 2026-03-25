import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openTestDatabase } from '../lib/open-test-database.ts';
import { initBeliefTables } from './init_belief_tables.ts';

describe('initBeliefTables', () => {
	it('creates the beliefs table', async () => {
		const db = await openTestDatabase();
		initBeliefTables(db);
		const row = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'beliefs'")
			.get();
		strictEqual(row?.name, 'beliefs');
	});
});
