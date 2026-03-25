import { DatabaseSync } from 'node:sqlite';

import type { CodexDb } from '../database.ts';

/** In-memory SQLite for tests — async for harness compatibility. */
export async function openTestDatabase(): Promise<CodexDb> {
	const db = new DatabaseSync(':memory:');
	db.exec('PRAGMA foreign_keys = ON');
	return db;
}
