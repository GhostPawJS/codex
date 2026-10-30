import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openCodexDb } from './open_codex_db.ts';

test('opens nested paths, initializes schema and configures WAL and timeout', async () => {
	const directory = mkdtempSync(join(tmpdir(), 'codex-db-'));
	try {
		const db = await openCodexDb(join(directory, 'nested', 'deeper', 'codex.db'));
		try {
			assert.equal(
				db.prepare('PRAGMA journal_mode').get<{ journal_mode: string }>()?.journal_mode,
				'wal',
			);
			assert.equal(db.prepare('PRAGMA busy_timeout').get<{ timeout: number }>()?.timeout, 5000);
			assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name = 'beliefs'").get());
			if (process.platform !== 'win32') {
				assert.equal(statSync(join(directory, 'nested', 'deeper', 'codex.db')).mode & 0o777, 0o600);
				assert.equal(statSync(join(directory, 'nested')).mode & 0o777, 0o700);
				assert.equal(statSync(join(directory, 'nested', 'deeper')).mode & 0o777, 0o700);
				chmodSync(join(directory, 'nested', 'deeper', 'codex.db'), 0o640);
				const reopened = await openCodexDb(join(directory, 'nested', 'deeper', 'codex.db'));
				reopened.close();
				assert.equal(statSync(join(directory, 'nested', 'deeper', 'codex.db')).mode & 0o777, 0o640);
			}
		} finally {
			db.close();
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
	const db = await openCodexDb(':memory:');
	db.close();
});
