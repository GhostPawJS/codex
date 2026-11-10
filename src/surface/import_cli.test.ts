import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { listBeliefs } from '../beliefs/list_beliefs.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';
import { openCodexDb } from './open_codex_db.ts';

test('belief import reads files, raw JSON array/JSONL stdin and dry-run flags; topic works on add/correct/list/search', async () => {
	const db = await openCodexDb(':memory:');
	const dir = mkdtempSync(join(tmpdir(), 'codex-import-'));
	const invoke = async (args: string[], input = '') => {
		let out = '',
			err = '';
		const sink = (append: (text: string) => void) =>
			new Writable({
				write(chunk, _enc, cb) {
					append(String(chunk));
					cb();
				},
			});
		const code = await runToolCli([...args, '--json', '--db', ':memory:'], {
			...codexCliOptions,
			openContext: () => db,
			closeContext: () => {},
			stdin: Readable.from(input ? [input] : []),
			stdout: sink((text) => {
				out += text;
			}),
			stderr: sink((text) => {
				err += text;
			}),
		});
		return { code, out, err };
	};
	try {
		const file = join(dir, 'beliefs.jsonl');
		const item = {
			claim: 'Release Tuesday',
			source: 'explicit',
			category: 'procedure',
			topic: 'work',
		};
		writeFileSync(
			file,
			`${JSON.stringify(item)}\n${JSON.stringify({ ...item, claim: 'Release Wednesday' })}\n`,
		);
		const dry = await invoke(['belief', 'import', `@${file}`, '--dry-run']);
		assert.equal(dry.code, 0, dry.err);
		assert.equal(JSON.parse(dry.out).data.dryRun, true);
		assert.equal(listBeliefs(db).length, 0);
		const imported = await invoke(['belief', 'import', `@${file}`]);
		assert.equal(imported.code, 0, imported.err);
		assert.equal(JSON.parse(imported.out).data.items.length, 2);
		const stdin = await invoke(
			['belief', 'import', '-'],
			JSON.stringify([{ ...item, claim: 'Release Friday' }]),
		);
		assert.equal(stdin.code, 0, stdin.err);
		const lines = await invoke(
			['belief', 'import', '-', '--dry-run'],
			`${JSON.stringify({ ...item, claim: 'Dry stdin one' })}\n${JSON.stringify({ ...item, claim: 'Dry stdin two' })}\n`,
		);
		assert.equal(lines.code, 0, lines.err);
		assert.equal(JSON.parse(lines.out).data.items.length, 2);
		assert.equal(listBeliefs(db).length, 3);
		const added = await invoke([
			'belief',
			'add',
			'Release Saturday',
			'--source',
			'explicit',
			'--category',
			'procedure',
			'--topic',
			'personal',
		]);
		assert.equal(added.code, 0, added.err);
		const id = JSON.parse(added.out).data.belief.id;
		const revised = await invoke([
			'belief',
			'correct',
			String(id),
			'--claim',
			'Release Sunday',
			'--topic',
			'weekend',
		]);
		assert.equal(revised.code, 0, revised.err);
		assert.equal(JSON.parse(revised.out).data.belief.topic, 'weekend');
		const list = await invoke(['review', 'list', '--topic', 'work']);
		assert.equal(list.code, 0, list.err);
		assert.equal(JSON.parse(list.out).data.payload.data.length, 3);
		const search = await invoke(['search', 'Release', '--topic', 'weekend']);
		assert.equal(search.code, 0, search.err);
		assert.equal(JSON.parse(search.out).data.results.length, 1);
		writeFileSync(file, '[invalid');
		const failed = await invoke(['belief', 'import', `@${file}`]);
		assert.equal(failed.code, 2);
		assert.match(failed.err, /Invalid JSON array/);
	} finally {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	}
});
