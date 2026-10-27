import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
						{ name: 'config', short: 'c', type: 'json' },
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
