import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';
import { resolveCodexDbPath } from './resolve_codex_db_path.ts';

test('default database notice is stderr-only, suppressible and limited to database commands', async () => {
	const previousDb = process.env.GHOSTPAW_CODEX_DB;
	const previousQuiet = process.env.GHOSTPAW_QUIET;
	const db = await createInitializedCodexDb();
	const invoke = async (args: string[]) => {
		let out = '',
			err = '';
		let opened = false;
		const code = await runToolCli(args, {
			...codexCliOptions,
			openContext: () => {
				opened = true;
				return db;
			},
			closeContext: () => {},
			stdin: Readable.from([]),
			stdout: new Writable({
				write(chunk, _encoding, cb) {
					out += String(chunk);
					cb();
				},
			}),
			stderr: new Writable({
				write(chunk, _encoding, cb) {
					err += String(chunk);
					cb();
				},
			}),
		});
		assert.equal(code, 0);
		return { out, err, opened };
	};
	try {
		delete process.env.GHOSTPAW_CODEX_DB;
		delete process.env.GHOSTPAW_QUIET;
		const normal = await invoke(['search', 'memory']);
		assert.equal(normal.opened, true);
		assert.equal(normal.err, `using default db ${resolveCodexDbPath()}\n`);
		assert.equal((await invoke(['search', 'memory', '--quiet'])).err, '');
		process.env.GHOSTPAW_QUIET = '1';
		const silent = await invoke(['search', 'memory']);
		assert.equal(silent.err, '');
		assert.equal(silent.out, normal.out);
		delete process.env.GHOSTPAW_QUIET;
		assert.equal((await invoke(['search', 'memory', '--db', ':memory:'])).err, '');
		process.env.GHOSTPAW_CODEX_DB = ':memory:';
		assert.equal((await invoke(['search', 'memory'])).err, '');
		delete process.env.GHOSTPAW_CODEX_DB;
		for (const args of [
			['help'],
			['version'],
			['tools'],
			['describe', 'search_codex'],
			['skill'],
			['completions', 'bash'],
			['search', '--help'],
		]) {
			const result = await invoke(args);
			assert.equal(result.err, '');
			assert.equal(result.opened, false);
		}
		assert.equal((await invoke(['call', 'search_codex', '{"query":"memory"}'])).err, normal.err);
		assert.equal((await invoke(['alias', 'list'])).err, normal.err);
	} finally {
		if (previousDb === undefined) delete process.env.GHOSTPAW_CODEX_DB;
		else process.env.GHOSTPAW_CODEX_DB = previousDb;
		if (previousQuiet === undefined) delete process.env.GHOSTPAW_QUIET;
		else process.env.GHOSTPAW_QUIET = previousQuiet;
		db.close();
	}
});
