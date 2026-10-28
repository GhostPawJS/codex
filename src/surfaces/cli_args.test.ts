import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { CliUsageError, parseCliArgs, renderCliHelp } from './cli_args.ts';

test('generic parser supports flags, aliases, arrays, files and positionals', () => {
	const dir = mkdtempSync(join(tmpdir(), 'cli-args-'));
	try {
		writeFileSync(join(dir, 'value'), '{"x":1}');
		assert.deepEqual(
			parseCliArgs(
				[
					'--min-score=2.5',
					'--no-enabled',
					'--tag',
					'a',
					'--tag=b',
					'-c',
					`@${join(dir, 'value')}`,
					'--',
					'-literal',
				],
				{
					command: 'test',
					flags: [
						{ name: 'min-score', type: 'number' },
						{ name: 'enabled', type: 'boolean' },
						{ name: 'tag', type: 'array' },
						{ name: 'config', short: 'c', type: 'json', file: true },
					],
					positionals: [{ name: 'query', type: 'string' }],
				},
			),
			{ minScore: 2.5, enabled: false, tag: ['a', 'b'], config: { x: 1 }, query: '-literal' },
		);
	} finally {
		rmSync(dir, { recursive: true });
	}
});
test('generic parser reports typed usage errors and renders schema help', () => {
	const spec = {
		command: 'test',
		flags: [{ name: 'limit', type: 'integer' as const, required: true, enum: [1, 2] }],
	};
	for (const args of [
		[],
		['--limit'],
		['--limit', 'no'],
		['--limit=1.5'],
		['--limit=3'],
		['--limti=1'],
	])
		assert.throws(() => parseCliArgs(args, spec), CliUsageError);
	assert.match(renderCliHelp(spec), /integer \(1\|2\) required/);
	assert.deepEqual(
		parseCliArgs(['1', '2'], {
			command: 'merge',
			positionals: [{ name: 'ids', type: 'integer', variadic: true }],
		}),
		{ ids: [1, 2] },
	);
});

test('flag values may start with dashes unless they look like a flag', () => {
	const spec = { command: 'test', flags: [{ name: 'claim', type: 'string' as const }] };
	for (const claim of ['---', '--', '--123', '--!', '-value'])
		assert.deepEqual(parseCliArgs(['--claim', claim], spec), { claim });
	for (const flag of ['--other', '--Other'])
		assert.throws(() => parseCliArgs(['--claim', flag], spec), /Missing value: --claim/);
});

test('file-capable arguments opt in; literal arguments retain every leading at sign', () => {
	const dir = mkdtempSync(join(process.cwd(), '.file-values-'));
	try {
		const path = join(dir, 'value');
		writeFileSync(path, 'long\nvalue\n');
		const spec = {
			command: 'test',
			flags: [{ name: 'claim', type: 'string' as const, file: true }],
		};
		assert.equal(parseCliArgs(['--claim', `@${path}`], spec).claim, 'long\nvalue\n');
		assert.equal(parseCliArgs(['--claim', '@@text'], spec).claim, '@text');
		for (const value of ['@', `@${path}-missing`])
			assert.throws(
				() => parseCliArgs(['--claim', value], spec),
				(error: unknown) => error instanceof CliUsageError && error.exitCode === 2,
			);
		const literal = { command: 'test', flags: [{ name: 'claim', type: 'string' as const }] };
		for (const value of ['@fox said hi', '@@x', '@-', '@'])
			assert.equal(parseCliArgs(['--claim', value], literal).claim, value);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('file-capable @- reads stdin bytes', async () => {
	const dir = mkdtempSync(join(process.cwd(), '.stdin-values-'));
	const script = join(dir, 'stdin.mjs');
	writeFileSync(
		script,
		"import {parseCliArgs} from '../src/surfaces/cli_args.ts';import {writeFileSync} from 'node:fs';writeFileSync(process.argv[2],JSON.stringify(parseCliArgs(['--claim','@-'],{command:'test',flags:[{name:'claim',type:'string',file:true}]})))",
	);
	const child = spawn(
		process.execPath,
		['--experimental-strip-types', script, join(dir, 'result.json')],
		{
			cwd: process.cwd(),
			stdio: ['pipe', 'pipe', 'pipe'],
		},
	);
	let err = '';
	child.stdout.resume();
	child.stderr.on('data', (s) => {
		err += String(s);
	});
	const exited = new Promise<number | null>((resolve, reject) => {
		child.on('error', reject);
		child.on('close', resolve);
	});
	child.stdin.end('first\nsecond\n');
	try {
		assert.equal(await exited, 0, err);
		assert.equal(
			JSON.parse(readFileSync(join(dir, 'result.json'), 'utf8')).claim,
			'first\nsecond\n',
		);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
