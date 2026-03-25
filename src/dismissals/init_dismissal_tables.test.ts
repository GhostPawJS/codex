import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openTestDatabase } from '../lib/open-test-database.ts';
import { initDismissalTables } from './init_dismissal_tables.ts';

describe('initDismissalTables', () => {
	it('creates the dismissals table', async () => {
		const db = await openTestDatabase();
		initDismissalTables(db);
		const row = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'dismissals'")
			.get();
		strictEqual(row?.name, 'dismissals');
	});
});
