import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { type TestContext, test } from 'node:test';
import { runToolCli } from '../surfaces/cli.ts';
import { codexCliOptions } from './codex_cli_options.ts';

function fixture(t: TestContext) {
	const dir = mkdtempSync(join(tmpdir(), 'codex-show-'));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	return {
		dir,
		run: async (...args: string[]) => {
			const out = new PassThrough(),
				err = new PassThrough();
			let stdout = '',
				stderr = '';
			out.on('data', (chunk) => {
				stdout += chunk;
			});
			err.on('data', (chunk) => {
				stderr += chunk;
			});
			const status = await runToolCli(['--db', join(dir, 'db'), ...args], {
				...codexCliOptions,
				stdin: Readable.from([]),
				stdout: out,
				stderr: err,
			});
			return { status, stdout, stderr };
		},
	};
}

test('show aliases preserve single results and keep ordered multi-id hits and misses', async (t) => {
	const { run } = fixture(t);
	for (const claim of ['First', 'Second'])
		assert.equal(
			(await run('belief', 'add', claim, '--source', 'explicit', '--category', 'fact')).status,
			0,
		);
	for (const path of [['show'], ['get'], ['belief', 'show']]) {
		assert.equal((await run(...path, '1')).stdout, (await run('belief', 'show', '1')).stdout);
		assert.equal(JSON.parse((await run(...path, '1', '--json')).stdout).data.detail.id, 1);
		const batch = await run(...path, '2', '99', '1', '--json');
		assert.equal(batch.status, 3);
		const { ok, data } = JSON.parse(batch.stdout);
		assert.equal(ok, false);
		assert.deepEqual(
			data.beliefs.map((b: { detail?: { id: number }; id?: number }) => b.detail?.id ?? b.id),
			[2, 99, 1],
		);
		assert.equal(data.beliefs[1].error.code, 'not_found');
		assert.match((await run(...path, '2', '1')).stdout, /Second[\s\S]*\n\n[\s\S]*First/);
		assert.match((await run(...path, '--help')).stdout, /Exit 3/);
	}
});

test('unknown command emits one JSON error and search help locates hits', async (t) => {
	const { run } = fixture(t);
	const bad = await run('belief', '39', '--json');
	assert.equal(bad.status, 2);
	assert.equal(JSON.parse(bad.stdout).error.code, 'usage_error');
	assert.match(bad.stderr, /--help/);
	assert.match((await run('search', '--help')).stdout, /data\.results/);
});

test('import suggests @path and reports indexed rollback reasons and valid sources', async (t) => {
	const { dir, run } = fixture(t);
	const path = join(dir, 'batch.json');
	const item = { claim: 'First', source: 'explicit', category: 'fact' };
	writeFileSync(path, JSON.stringify([item, { ...item, source: 'documented' }]));
	assert.ok((await run('belief', 'import', path)).stderr.includes(`Did you mean @${path}?`));
	const bad = await run('belief', 'import', `@${path}`, '--json');
	assert.equal(bad.status, 2);
	assert.match(
		bad.stderr,
		/^No items were persisted\. Item 1: Unsupported belief source: documented\. Valid sources: [a-z, ]+\.\nCorrect the indexed item errors and retry the whole batch\.\n$/,
	);
	const sources = 'explicit, observed, distilled, inferred';
	assert.ok(JSON.parse(bad.stdout).error.message.includes(sources));
	assert.ok((await run('belief', 'import', '--help')).stdout.includes(sources));
	assert.equal((await run('show', '1')).status, 3);
});
