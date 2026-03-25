import type { CodexDb } from '../database.ts';
import { initCodexTables } from '../init_codex_tables.ts';

import { openTestDatabase } from './open-test-database.ts';

/** In-memory DB with full codex schema — shared by tests. */
export async function createInitializedCodexDb(): Promise<CodexDb> {
	const db = await openTestDatabase();
	initCodexTables(db);
	return db;
}
