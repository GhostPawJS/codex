import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';

test('codex noun verb add, search, show and not found use a file database', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'codex-cli-'));
	try {
		const invoke = async (args: string[]) => {
			let out = '';
			const code = await runToolCli([...args, '--db', join(dir, 'test.db'), '--json'], {
				...codexCliOptions,
				stdin: Readable.from([]),
				stdout: new Writable({
					write(chunk, _encoding, cb) {
						out += String(chunk);
						cb();
					},
				}),
				stderr: new Writable({
					write(_chunk, _encoding, cb) {
						cb();
					},
				}),
			});
			return { code, result: JSON.parse(out) };
		};
		const added = await invoke([
			'belief',
			'add',
			'Deploys happen on Tuesdays',
			'--source',
			'explicit',
			'--category',
			'procedure',
		]);
		assert.equal(added.code, 0);
		const found = await invoke(['search', 'deploys']);
		assert.equal(found.result.data.results[0].id, added.result.data.belief.id);
		assert.equal((await invoke(['belief', 'show', String(added.result.data.belief.id)])).code, 0);
		assert.equal((await invoke(['belief', 'show', '99999'])).code, 3);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
