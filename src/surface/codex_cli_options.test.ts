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

test('plain CLI output, quiet ids, per-action help, dates and guide commands', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'codex-plain-'));
	const path = join(dir, 'test.db');
	const invoke = async (args: string[]) => {
		let out = '',
			err = '';
		const stream = (append: (text: string) => void) =>
			new Writable({
				write(chunk, _encoding, cb) {
					append(String(chunk));
					cb();
				},
			});
		const code = await runToolCli([...args, '--db', path], {
			...codexCliOptions,
			stdin: Readable.from([]),
			stdout: stream((text) => {
				out += text;
			}),
			stderr: stream((text) => {
				err += text;
			}),
		});
		return { code, out, err };
	};
	try {
		const add = await invoke([
			'belief',
			'add',
			'Deploys\ngo out on Tuesdays.',
			'--source',
			'explicit',
			'--category',
			'procedure',
		]);
		assert.equal(add.code, 0);
		assert.match(add.out, /id: +1\nclaim: +Deploys go out on Tuesdays\./);
		assert.match(add.out, /certainty: +0\.90/);
		assert.match(add.out, /created: +\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
		assert.match(
			(await invoke(['search', 'deploys'])).out,
			/^1 {2}Deploys go out on Tuesdays\. {2}\[0\.90 explicit strong\]\n$/,
		);
		assert.equal((await invoke(['search', 'deploys', '--quiet'])).out, '1\n');
		assert.equal((await invoke(['review', 'log', '--quiet'])).out, '1\n');
		assert.equal((await invoke(['review', 'status', '--quiet'])).out, '');
		assert.equal((await invoke(['version', '--quiet'])).out, '');
		assert.match((await invoke(['review', 'status'])).out, /activeBeliefCount: +1/);
		assert.match(
			(await invoke(['review', 'log'])).out,
			/^1 {2}remembered {2}Deploys go out on Tuesdays\./,
		);
		assert.match((await invoke(['belief', 'show', '1'])).out, /lineage: +1/);
		assert.match((await invoke(['review', 'flags'])).out, /0 beliefs flagged/);
		assert.match(
			(await invoke(['belief', 'defer', '1', '--deferred-until', '+3d'])).out,
			/\(id 1\)/,
		);
		assert.match((await invoke(['belief', 'show', '1'])).out, /deferred until:/);
		assert.equal(
			(await invoke(['belief', 'defer', '1', '--deferred-until', '2000-01-01'])).code,
			2,
		);
		const clarify = await invoke(['belief', 'correct', '1']);
		assert.equal(clarify.code, 3);
		assert.equal(clarify.out, '');
		assert.match(clarify.err, /Missing: --claim/);
		const missing = await invoke(['search']);
		assert.equal(missing.code, 2);
		assert.match(
			missing.err,
			/Missing required argument: query\. Usage: ghostpaw-codex search <query> \[flags\]. See ghostpaw-codex search --help/,
		);
		for (const action of ['confirm', 'correct', 'forget', 'defer', 'merge']) {
			const help = await invoke(['belief', action, '--help']);
			assert.equal(help.code, 0);
			assert.equal(help.out.includes('--deferred-until'), action === 'defer');
			assert.equal(help.out.includes('--claim'), ['correct', 'merge'].includes(action));
			const invalid = await invoke(['belief', action, '--provenance', 'unused']);
			assert.equal(invalid.code, 2);
			assert.match(invalid.err, /Allowed flags:/);
		}
		assert.match((await invoke(['--help'])).out, new RegExp(`Database: ${path}`));
		assert.match((await invoke(['--version'])).out, /^ghostpaw-codex \d+\.\d+\.\d+ \(library\)/);
		assert.match((await invoke(['skill', '--help'])).out, /Usage: ghostpaw-codex skill/);
		assert.match((await invoke(['skill', '--list'])).out, /capture-beliefs-well {2}/);
		assert.equal((await invoke(['skill', 'capture-beliefs-wel'])).code, 2);
		assert.ok(
			JSON.parse((await invoke(['search', 'deploys', '--json', '--compact'])).out).data.results
				.length,
		);
		assert.ok(
			JSON.parse((await invoke(['call', 'search_codex', '{"query":"deploys"}'])).out).data.results
				.length,
		);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
