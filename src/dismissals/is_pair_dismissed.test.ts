import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openTestDatabase } from '../lib/open-test-database.ts';
import { initDismissalTables } from './init_dismissal_tables.ts';
import { isPairDismissed } from './is_pair_dismissed.ts';
import { recordDismissal } from './record_dismissal.ts';

describe('isPairDismissed', () => {
	it('checks whether a pair is currently suppressed', async () => {
		const db = await openTestDatabase();
		initDismissalTables(db);
		recordDismissal(db, 1, 2, 1_000);
		strictEqual(isPairDismissed(db, 2, 1, 1_001), true);
		strictEqual(isPairDismissed(db, 2, 1, 10_000_000_000), false);
	});
});
