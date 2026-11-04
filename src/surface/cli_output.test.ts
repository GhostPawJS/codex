import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';

test('read commands accept JSON, environment opts in, and retire always warns', async (t) => {
	t.mock.method(Date, 'now', () => 1_790_000_000_000);
	const dir = mkdtempSync(join(tmpdir(), 'codex-output-'));
	const previous = process.env.GHOSTPAW_OUTPUT;
	const invoke = async (args: string[], tty = false) => {
		let out = '',
			err = '';
		const capture = (append: (text: string) => void) =>
			new Writable({
				write(chunk, _encoding, cb) {
					append(String(chunk));
					cb();
				},
			});
		const stdout = Object.assign(
			capture((text) => {
				out += text;
			}),
			{ isTTY: tty },
		);
		const code = await runToolCli([...args, '--db', join(dir, 'test.db')], {
			...codexCliOptions,
			stdin: Readable.from([]),
			stdout,
			stderr: capture((text) => {
				err += text;
			}),
		});
		return { code, out, err };
	};
	try {
		delete process.env.GHOSTPAW_OUTPUT;
		const added = JSON.parse(
			(
				await invoke([
					'belief',
					'add',
					'Deploy Tuesdays',
					'--source',
					'explicit',
					'--category',
					'fact',
					'--json',
				])
			).out,
		);
		const id = String(added.data.belief.id);
		const commands = [
			['search', 'deploy'],
			...['flags', 'status', 'log', 'trends', 'duplicates'].map((view) => ['review', view]),
			['belief', 'show', id],
			['alias', 'list'],
			['tools'],
			['describe', 'retire_belief'],
			['version'],
			['--version'],
			['skill', '--list'],
			['skill'],
			['help'],
			['belief', 'retire', '--help'],
			['completions', 'bash'],
			['completions', 'zsh'],
			['completions', 'fish'],
		];
		for (const command of commands) {
			const explicit = await invoke([...command, '--json']);
			assert.equal(explicit.code, 0, command.join(' '));
			assert.doesNotThrow(() => JSON.parse(explicit.out), command.join(' '));
			process.env.GHOSTPAW_OUTPUT = 'json';
			const env = await invoke(command);
			assert.equal(env.code, 0, command.join(' '));
			assert.deepEqual(JSON.parse(env.out), JSON.parse(explicit.out));
			delete process.env.GHOSTPAW_OUTPUT;
		}
		for (const tty of [false, true]) {
			const baseline = await invoke(['search', 'deploy'], tty);
			assert.match(baseline.out, /Deploy Tuesdays/);
			assert.throws(() => JSON.parse(baseline.out));
			process.env.GHOSTPAW_OUTPUT = 'text';
			assert.equal((await invoke(['search', 'deploy'], tty)).out, baseline.out);
			delete process.env.GHOSTPAW_OUTPUT;
		}
		for (const command of [
			['belief', 'retire', id],
			['belief', 'retire', id, '--json'],
			['belief', 'retire', id, '--quiet'],
			['call', 'retire_belief', JSON.stringify({ beliefId: Number(id) })],
		]) {
			const result = await invoke(command);
			assert.equal(result.code, 0);
			assert.match(
				result.err,
				/WARNING:.*whole lineage.*predecessors\/successors.*cannot be undone.*belief forget.*soft removal/,
			);
		}
		const help = await invoke(['belief', 'retire', '--help']);
		assert.match(help.out, /WARNING:.*cannot be undone.*belief forget/);
	} finally {
		if (previous === undefined) delete process.env.GHOSTPAW_OUTPUT;
		else process.env.GHOSTPAW_OUTPUT = previous;
		rmSync(dir, { recursive: true, force: true });
	}
});
