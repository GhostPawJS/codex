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

it('migrates a legacy beliefs table idempotently while preserving rows', async () => {
	const db = await openTestDatabase();
	db.exec(`CREATE TABLE beliefs (
		id INTEGER PRIMARY KEY, claim TEXT NOT NULL, claim_normalized TEXT NOT NULL,
		certainty REAL NOT NULL, evidence INTEGER NOT NULL, source TEXT NOT NULL, category TEXT NOT NULL,
		created_at INTEGER NOT NULL, verified_at INTEGER NOT NULL, superseded_by INTEGER REFERENCES beliefs(id),
		provenance TEXT, deferred_until INTEGER, embedding BLOB NOT NULL, embedding_norm REAL NOT NULL,
		embedding_dim INTEGER NOT NULL, embedding_version TEXT NOT NULL
	);
	INSERT INTO beliefs VALUES (1, 'Legacy', 'legacy', 0.9, 1, 'explicit', 'fact', 1, 1, NULL, NULL, NULL, X'00000000', 0, 1, 'old')`);
	initBeliefTables(db);
	initBeliefTables(db);
	strictEqual(db.prepare('SELECT claim FROM beliefs WHERE id = 1').get()?.claim, 'Legacy');
	strictEqual(
		db.prepare('SELECT superseded_reason FROM beliefs WHERE id = 1').get()?.superseded_reason,
		null,
	);
	db.close();
});
