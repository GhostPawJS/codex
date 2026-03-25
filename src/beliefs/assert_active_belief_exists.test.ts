import { throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openTestDatabase } from '../lib/open-test-database.ts';
import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { initBeliefTables } from './init_belief_tables.ts';

describe('assertActiveBeliefExists', () => {
	it('throws when an active belief does not exist', async () => {
		const db = await openTestDatabase();
		initBeliefTables(db);
		throws(() => assertActiveBeliefExists(db, 1), /not found/i);
	});
});
