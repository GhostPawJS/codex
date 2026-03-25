import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openTestDatabase } from '../lib/open-test-database.ts';
import { initDismissalTables } from './init_dismissal_tables.ts';
import { recordDismissal } from './record_dismissal.ts';

describe('recordDismissal', () => {
	it('records and backs off dismissed pairs', async () => {
		const db = await openTestDatabase();
		initDismissalTables(db);
		const first = recordDismissal(db, 5, 2, 1_000);
		const second = recordDismissal(db, 2, 5, 1_000);
		strictEqual(first.belief_a, 2);
		strictEqual(second.dismiss_count, 2);
		strictEqual(second.resurface_after > first.resurface_after, true);
	});
});
