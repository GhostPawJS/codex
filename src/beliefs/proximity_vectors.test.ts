import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { it } from 'node:test';
import { initCodexTables } from '../init_codex_tables.ts';
import { loadProximityVectors } from './proximity_vectors.ts';
import { remember } from './remember.ts';

it('keeps cached vectors equivalent across inserts, updates, deletes, rollback and external commits', () => {
	const dir = mkdtempSync(join(tmpdir(), 'codex-vectors-'));
	const db = new DatabaseSync(join(dir, 'test.db'));
	const other = new DatabaseSync(join(dir, 'test.db'));
	try {
		db.exec('PRAGMA journal_mode=WAL');
		initCodexTables(db);
		const add = () => remember(db, { claim: 'Jasmine tea', source: 'explicit', category: 'fact' });
		const portable = { prepare: db.prepare.bind(db), exec: db.exec.bind(db), close: () => {} };
		const compare = () => deepStrictEqual(loadProximityVectors(db), loadProximityVectors(portable));
		add();
		const cached = loadProximityVectors(db);
		strictEqual(loadProximityVectors(db), cached);
		add();
		strictEqual(loadProximityVectors(db), cached);
		compare();
		db.exec('UPDATE beliefs SET embedding = zeroblob(1024) WHERE id = 2');
		compare();
		db.exec('BEGIN; UPDATE beliefs SET superseded_by = id WHERE id = 2');
		compare();
		db.exec('ROLLBACK');
		compare();
		other.exec('UPDATE beliefs SET superseded_by = id WHERE id = 2');
		compare();
		other.exec('DELETE FROM beliefs WHERE id = 2');
		compare();
		add();
		compare();
	} finally {
		other.close();
		db.close();
		rmSync(dir, { recursive: true, force: true });
	}
});
