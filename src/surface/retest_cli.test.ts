import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';
import { openCodexDb } from './open_codex_db.ts';

test('CLI literal values, provenance, duplicate, aliases, validation and supersession', async () => {
	const dir = mkdtempSync(join(process.cwd(), '.retest-cli-'));
	const path = join(dir, 'test.db');
	const invoke = async (args: string[]) => {
		let out = '',
			err = '';
		const sink = (append: (text: string) => void) =>
			new Writable({
				write(chunk, _encoding, cb) {
					append(String(chunk));
					cb();
				},
			});
		const code = await runToolCli(['--db', path, ...args], {
			...codexCliOptions,
			stdin: Readable.from([]),
			stdout: sink((s) => {
				out += s;
			}),
			stderr: sink((s) => {
				err += s;
			}),
		});
		return { code, out, err };
	};
	try {
		const add = [
			'belief',
			'add',
			'@fox said hi',
			'--source',
			'explicit',
			'--category',
			'fact',
			'--provenance',
			'chat:1',
		];
		const first = await invoke([...add, '-j']);
		assert.equal(first.code, 0);
		assert.equal(JSON.parse(first.out).data.belief.claim, '@fox said hi');
		const duplicate = await invoke([...add, '-j']);
		assert.equal(duplicate.code, 0);
		assert.equal(JSON.parse(duplicate.out).outcome, 'no_op');
		assert.equal(JSON.parse(duplicate.out).warnings[0].code, 'duplicate');
		assert.equal((await invoke([...add, '--allow-duplicate', '-q'])).out, '2\n');
		assert.equal(
			(await invoke(['belief', 'add', '@@x', '--source', 'explicit', '--category', 'fact', '-j']))
				.code,
			0,
		);
		assert.equal((await invoke(['search', 'zebra'])).out, 'No matching beliefs.\n');
		assert.equal((await invoke(['search', 'zebra'])).err, '');
		assert.match((await invoke(['search', 'fox'])).out, /provenance: chat:1/);
		assert.match((await invoke(['belief', 'show', '1'])).out, /provenance: +chat:1/);
		for (const args of [
			['alias', 'add', 'two words', 'x'],
			['alias', 'add', 'same', 'same'],
			['belief', 'add', '', '--source', 'explicit', '--category', 'fact'],
			['belief', 'add', 'bad', '--source', 'explicit', '--category', 'fact', '--certainty', '1.5'],
			['belief', 'merge', '1', '2'],
		])
			assert.equal((await invoke(args)).code, 2, args.join(' '));
		const missing = await invoke(['search', 'fox', '--db', join(dir, 'missing', 'x.db')]);
		assert.equal(missing.code, 3);
		assert.match(missing.err, /missing/);
		assert.equal(
			(await invoke(['belief', 'correct', '1', '-c', 'Fox waves', '--provenance', 'chat:2'])).code,
			0,
		);
		const superseded = await invoke(['belief', 'confirm', '1']);
		assert.equal(superseded.code, 3);
		assert.match(superseded.err, /superseded by 4; use 4/);
		assert.match((await invoke(['belief', 'show', '1'])).out, /superseded by 4/);
		assert.equal((await invoke(['belief', 'confirm', '4', '--provenance', 'chat:3'])).code, 0);
		assert.equal(
			(await invoke(['belief', 'defer', '4', '--deferred-until', '+3d', '--provenance', 'chat:4']))
				.code,
			0,
		);
		assert.match((await invoke(['belief', 'show', '4'])).out, /provenance: +chat:4/);
		assert.equal(
			(
				await invoke([
					'belief',
					'merge',
					'2',
					'3',
					'--claim',
					'Combined greetings',
					'--provenance',
					'chat:5',
				])
			).code,
			0,
		);
		assert.match((await invoke(['belief', 'show', '5'])).out, /provenance: +chat:5/);
		assert.equal((await invoke(['belief', 'forget', '5', '--provenance', 'chat:6'])).code, 0);
		assert.match((await invoke(['belief', 'show', '5'])).out, /provenance: +chat:6/);

		assert.match(
			(await invoke(['belief', 'defer', '--help'])).out,
			/tomorrow.*\+3d.*YYYY-MM-DD.*process time zone/,
		);
		const nounHelp = await invoke(['belief', '--help']);
		assert.match(nounHelp.out, /belief add/);
		assert.match(nounHelp.out, /belief correct/);
		assert.doesNotMatch(nounHelp.out, /alias add|mcp, skill| {2}search/);
		assert.match((await invoke(['belief', 'defer', '--help'])).out, /--deferred-until {2}string/);
		for (const now of ['+8d', '2026-11-10', '2000-01-01', '0'])
			assert.equal((await invoke(['review', 'flags', '--now', now])).code, 0, now);
		assert.equal((await invoke(['review', 'flags', '--now', 'bad-date'])).code, 2);
		assert.equal(
			(
				await invoke([
					'belief',
					'add',
					'Extra greeting',
					'--source',
					'explicit',
					'--category',
					'fact',
				])
			).code,
			0,
		);
		assert.equal((await invoke(['belief', 'merge', '6', '--successor-id', '4'])).code, 0);
		assert.equal((await invoke(['belief', 'correct', '4', '-c', 'Fox waves again'])).code, 0);
		assert.match((await invoke(['belief', 'confirm', '1'])).err, /superseded by 7; use 7/);
		assert.match((await invoke(['belief', 'show', '1'])).out, /superseded by 7/);
		assert.equal((await invoke(['alias', 'add', 'class', 'warrior'])).code, 0);
		assert.equal(
			(await invoke(['alias', 'add', 'class', 'warrior'])).out,
			'Alias exists: class -> warrior\n',
		);
		assert.equal((await invoke(['alias', 'list', '-q'])).out, 'class warrior\n');
		assert.equal(JSON.parse((await invoke(['alias', 'list', '-j'])).out).ok, true);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('twenty concurrent CLI adds serialize duplicate detection on a cold database', async () => {
	const dir = mkdtempSync(join(process.cwd(), '.retest-concurrency-'));
	const path = join(dir, 'test.db');
	try {
		const results = await Promise.all(
			Array.from(
				{ length: 20 },
				() =>
					new Promise<{ code: number | null; err: string }>((resolve, reject) => {
						const child = spawn(
							process.execPath,
							[
								'--experimental-strip-types',
								'src/cli.ts',
								'belief',
								'add',
								'Concurrent identical claim',
								'--source',
								'explicit',
								'--category',
								'fact',
								'--db',
								path,
								'--json',
							],
							{ cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
						);
						let err = '';
						child.stderr.on('data', (s) => {
							err += String(s);
						});
						child.stdout.on('data', (s) => {
							err += String(s);
						});
						child.on('error', reject);
						child.on('close', (code) => resolve({ code, err }));
					}),
			),
		);
		for (const result of results) assert.equal(result.code, 0, result.err);
		const db = await openCodexDb(path);
		try {
			assert.equal(db.prepare('SELECT COUNT(*) AS n FROM beliefs').get<{ n: number }>()?.n, 1);
		} finally {
			db.close();
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
