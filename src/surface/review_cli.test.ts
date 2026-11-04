import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';
import { openCodexDb } from './open_codex_db.ts';

test('review prefix counts and immediate duplicates', async () => {
	const db = await openCodexDb(':memory:');
	const invoke = async (args: string[]) => {
		let out = '',
			err = '';
		const sink = (append: (s: string) => void) =>
			new Writable({
				write(chunk, _enc, cb) {
					append(String(chunk));
					cb();
				},
			});
		const code = await runToolCli(args, {
			...codexCliOptions,
			openContext: () => db,
			closeContext: () => {},
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
		const added = await invoke([
			'belief',
			'add',
			'--claim',
			'instagram-desk: note',
			'--source',
			'explicit',
			'--category',
			'fact',
		]);
		assert.equal(added.code, 0, added.err);
		const prefixes = await invoke(['review', 'status', '--by-prefix']);
		assert.equal(prefixes.code, 0, prefixes.err);
		assert.equal(prefixes.out, '1 instagram-desk\n');
		const prefixJson = await invoke(['review', 'status', '--by-prefix', '--json']);
		assert.equal(JSON.parse(prefixJson.out).data.payload.data.prefixCounts[0].count, 1);
		const addDuplicate = await invoke([
			'belief',
			'add',
			'--claim',
			'instagram-desk: note',
			'--source',
			'explicit',
			'--category',
			'fact',
			'--allow-duplicate',
		]);
		assert.equal(addDuplicate.code, 0, addDuplicate.err);
		assert.equal((await invoke(['review', 'status', '--by-prefix', '--quiet'])).out, '');
		assert.equal((await invoke(['review', 'duplicates', '--quiet', '--limit', '1'])).out, '1 2\n');
		const duplicates = await invoke(['review', 'duplicates', '--limit', '1']);
		assert.equal(duplicates.code, 0, duplicates.err);
		assert.match(duplicates.out, /^#1 #2 1.00 "instagram-desk: note" \| "instagram-desk: note"\n$/);
		const pairs = await invoke(['review', 'duplicates', '--json', '--limit', '1']);
		assert.equal(JSON.parse(pairs.out).data.payload.data[0].beliefB, 2);
		assert.equal((await invoke(['proximity', 'dismiss', '1', '2'])).code, 0);
		assert.match((await invoke(['review', 'duplicates'])).out, /0 near-duplicate pairs/);
		assert.equal((await invoke(['belief', 'forget', '2'])).code, 0);
	} finally {
		db.close();
	}
});
