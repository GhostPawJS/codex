import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { initCodexTables } from './init_codex_tables.ts';
import { openTestDatabase } from './lib/open-test-database.ts';

describe('initCodexTables', () => {
	it('creates the core codex schema', async () => {
		const db = await openTestDatabase();
		initCodexTables(db);
		const beliefRow = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'beliefs'")
			.get();
		const dismissalRow = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'dismissals'")
			.get();
		strictEqual(beliefRow?.name, 'beliefs');
		strictEqual(dismissalRow?.name, 'dismissals');
	});
});
