import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { getStatus } from '../beliefs/get_status.ts';
import { recall } from '../beliefs/recall_beliefs.ts';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';
import { openCodexDb } from './open_codex_db.ts';

test('safe search, raw FTS, prefix, positional help and correction output', async () => {
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
		for (const claim of [
			'instagram-desk: note',
			'agentpreneur: German WoW price visible',
			'-leading note',
			'  PREFIX literal %_ note',
			'other prefix note',
		]) {
			assert.equal(
				(
					await invoke([
						'belief',
						'add',
						'--claim',
						claim,
						'--source',
						'explicit',
						'--category',
						'fact',
					])
				).code,
				0,
			);
		}
		for (const query of [
			'instagram-desk:',
			'agentpreneur: German WoW price visible',
			'-leading',
			'"agentpreneur:"',
		]) {
			const result = await invoke(['search', '--query', query]);
			assert.equal(result.code, 0, result.err);
			assert.doesNotMatch(result.out, /No matching/);
			assert.ok(recall(db, query).length);
		}
		assert.deepEqual(
			recall(db, 'German WoW').map((r) => r.id),
			[2],
		);
		assert.deepEqual(
			recall(db, '"German WoW"').map((r) => r.id),
			[2],
		);
		assert.deepEqual(recall(db, '"WoW German"'), []);
		assert.equal((await invoke(['search', 'instagram OR agentpreneur', '--fts'])).code, 0);
		assert.equal(recall(db, 'instagram OR agentpreneur', { fts: true }).length, 2);
		const bad = await invoke(['search', 'x AND (', '--fts']);
		assert.equal(bad.code, 2);
		assert.equal(bad.out, '');
		assert.equal(bad.err, 'Invalid FTS query "x AND (" (omit --fts to search literal text)\n');
		assert.deepEqual(
			recall(db, 'note', { prefix: 'prefix literal %_' }).map((r) => r.id),
			[4],
		);
		assert.deepEqual(recall(db, 'note', { prefix: 'absent' }), []);
		assert.match(
			(await invoke(['search', 'note', '--prefix', 'prefix literal %_'])).out,
			/PREFIX literal/,
		);
		for (const args of [
			['belief', 'add', 'unused', '--help'],
			['belief', 'correct', '1', 'unused', '-h'],
			['search', 'unused', '--help'],
		]) {
			const result = await invoke(args);
			assert.equal(result.code, 0);
			assert.match(result.out, /Usage:/i);
		}
		assert.equal(getStatus(db).totalBeliefCount, 5);
		const status = getStatus(db);
		assert.equal(status.newUnconfirmed, 5);
		assert.equal(status.denominator, 5);
		assert.equal(getStatus(db, Date.now() + 8 * 86400000).newUnconfirmed, 0);
		assert.match((await invoke(['review', 'status'])).out, /certainty >= 0.7 \/ active/);
		const corrected = await invoke(['belief', 'correct', '1', '--claim', 'replacement']);
		assert.equal(corrected.code, 0, corrected.err);
		assert.match(corrected.out, /^superseded #1 → #6\n/);
		const compact = await invoke([
			'belief',
			'correct',
			'6',
			'--claim',
			'next replacement',
			'--compact',
		]);
		assert.match(compact.out, / superseded=#6/);
	} finally {
		db.close();
	}
});
