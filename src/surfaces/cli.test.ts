import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { runToolCli } from './cli.ts';
import type { SurfaceTool } from './surface_types.ts';

const tool: SurfaceTool<number> = {
	name: 'test_tool',
	description: 'Test a tool',
	readOnly: true,
	whenToUse: 'testing',
	inputSchema: {
		type: 'object',
		properties: {
			someValue: { type: 'integer' },
			enabled: { type: 'boolean' },
			ids: { type: 'array', items: { type: 'integer' } },
			config: { type: 'object' },
		},
		required: ['someValue'],
	},
	handler: (_ctx, input) => ({
		ok: input.someValue !== 0,
		outcome:
			input.someValue === 3 ? 'needs_clarification' : input.someValue === 0 ? 'error' : 'success',
		input,
	}),
};
async function invoke(args: string[], input = '') {
	let out = '';
	let err = '';
	let opens = 0;
	let closes = 0;
	const stdout = new Writable({
		write(chunk, _encoding, cb) {
			out += String(chunk);
			cb();
		},
	});
	const stderr = new Writable({
		write(chunk, _encoding, cb) {
			err += String(chunk);
			cb();
		},
	});
	const contexts: { db?: string }[] = [];
	const code = await runToolCli(args, {
		bin: 'test',
		version: '1.0',
		description: 'Test CLI',
		tools: [tool],
		stdin: Readable.from([input]),
		stdout,
		stderr,
		openContext: (opts) => {
			contexts.push(opts);
			return ++opens;
		},
		closeContext: () => {
			closes++;
		},
		commands: {
			skill: () => 'skill text\n',
			mcp: (opts) => {
				contexts.push(opts);
			},
		},
	});
	return { code, out, err, opens, closes, contexts };
}
test('informational commands do not open context', async () => {
	for (const args of [
		[],
		['--help'],
		['-h'],
		['help'],
		['--version'],
		['-v'],
		['tools'],
		['tools', '--json'],
		['describe', 'test-tool'],
		['skill'],
	]) {
		const result = await invoke(args);
		assert.equal(result.code, 0);
		assert.equal(result.opens, 0);
		assert.ok(result.out);
	}
});
test('CLI coerces schema flags, aliases, arrays, objects and global options', async () => {
	const result = await invoke([
		'test-tool',
		'--some-value',
		'5',
		'--enabled',
		'--ids',
		'1',
		'--ids',
		'2',
		'--config',
		'{"a":true}',
		'--db',
		':memory:',
		'--compact',
	]);
	assert.equal(result.code, 0);
	assert.equal(result.closes, 1);
	assert.deepEqual(result.contexts, [{ db: ':memory:' }]);
	assert.deepEqual(JSON.parse(result.out).input, {
		someValue: 5,
		enabled: true,
		ids: [1, 2],
		config: { a: true },
	});
	assert.equal(result.out.trim().split('\n').length, 1);
	assert.equal((await invoke(['test_tool', '--some_value=2', '--ids', '[1,2]'])).code, 0);
});
test('CLI JSON args and stdin, errors, clarification and usage exit codes', async () => {
	for (const args of [
		['call', 'test_tool', '{"someValue":1}'],
		['call', 'test-tool', '-'],
		['call', 'test_tool'],
	])
		assert.equal((await invoke(args, '{"someValue":1}')).code, 0);
	assert.equal((await invoke(['call', 'test_tool', '{"someValue":0}'])).code, 1);
	assert.equal((await invoke(['call', 'test_tool', '{"someValue":3}'])).code, 3);
	for (const value of ['[]', '{}', '{"someValue":"wrong"}', '{']) {
		const result = await invoke(['call', 'test_tool', value]);
		assert.equal(result.code, 1);
		assert.equal(result.opens, 0);
		assert.ok(result.err);
		assert.equal(result.out, '');
	}
	for (const args of [
		['unknown'],
		['--db'],
		['test_tool', '--bad', '1'],
		['test_tool', '--someValue'],
	])
		assert.equal((await invoke(args)).code, 2);
	assert.deepEqual((await invoke(['mcp', '--db', 'test.db'])).contexts, [{ db: 'test.db' }]);
});
test('handler throws still close the context', async () => {
	let closed = false;
	const code = await runToolCli(['call', 'test_tool', '{"someValue":1}'], {
		bin: 'test',
		version: '1',
		description: '',
		tools: [
			{
				...tool,
				handler: () => {
					throw new Error('oops');
				},
			},
		],
		openContext: () => 1,
		closeContext: () => {
			closed = true;
		},
		stderr: new Writable({
			write(_chunk, _encoding, cb) {
				cb();
			},
		}),
	});
	assert.equal(code, 1);
	assert.equal(closed, true);
});

test('noun verb commands use schema parsing, help, JSON, quiet and stdin', async () => {
	assert.equal((await invoke(['tool', 'test', '--some-value', '2', '--json'])).code, 0);
	assert.deepEqual(
		JSON.parse(
			(await invoke(['tool', 'test', '-', '--some-value', '2'], '{"someValue":1,"enabled":true}'))
				.out,
		).input,
		{ someValue: 2, enabled: true },
	);
	assert.equal((await invoke(['tool', 'test', '--some-value=2', '--quiet'])).out, '');
	assert.match((await invoke(['tool', 'test', '--help'])).out, /--some-value/);
	assert.match((await invoke(['help', 'tool'])).out, /tool test/);
	for (const shell of ['bash', 'zsh', 'fish'])
		assert.match((await invoke(['completions', shell])).out, /test/);
	for (const [value, code] of [
		[1, 0],
		[0, 1],
		[3, 3],
	] as const)
		assert.equal((await invoke(['tool', 'test', '--some-value', String(value)])).code, code);
	const bad = await invoke(['tool', 'test', '--some-value=bad', '--json']);
	assert.equal(bad.code, 2);
	assert.equal(JSON.parse(bad.out).error.code, 'usage_error');
	assert.equal((await invoke(['tool', 'test'], '{"someValue":1}')).code, 0);
});
test('noun verb handler exceptions return 70 and close context', async () => {
	let closed = false;
	let output = '';
	const sink = new Writable({
		write(chunk, _encoding, cb) {
			output += String(chunk);
			cb();
		},
	});
	const code = await runToolCli(['tool', 'test', '--some-value=1'], {
		bin: 'test',
		version: '1',
		description: '',
		tools: [
			{
				...tool,
				handler: () => {
					throw new Error('failure');
				},
			},
		],
		openContext: () => 1,
		closeContext: () => {
			closed = true;
		},
		stdout: sink,
		stderr: sink,
	});
	assert.equal(code, 70);
	assert.equal(closed, true);
	assert.match(output, /failure/);
});

test('noun verb error results preserve JSON and conflict exit codes', async () => {
	for (const [errorCode, expected] of [
		['not_found', 3],
		['conflict', 4],
		['other', 1],
	] as const) {
		let out = '';
		let err = '';
		const result = { ok: false, error: { code: errorCode, message: 'details' } };
		const code = await runToolCli(['tool', 'test', '--some-value=1', '--json'], {
			bin: 'test',
			version: '1',
			description: '',
			tools: [{ ...tool, handler: () => result }],
			openContext: () => 1,
			stdout: new Writable({
				write(chunk, _encoding, cb) {
					out += String(chunk);
					cb();
				},
			}),
			stderr: new Writable({
				write(chunk, _encoding, cb) {
					err += String(chunk);
					cb();
				},
			}),
		});
		assert.equal(code, expected);
		assert.deepEqual(JSON.parse(out), result);
		assert.match(err, /details/);
	}
	assert.equal((await invoke(['tool', 'test', '--some-value=1', '-'], '{bad')).code, 2);
	assert.equal((await invoke(['tool', 'test', '--some-value=2', '-'], '{"someValue":1}')).code, 0);
});

test('version flags and command print the human library variant', async () => {
	for (const args of [['--version'], ['-V'], ['-v'], ['version']]) {
		const result = await invoke(args);
		assert.equal(result.code, 0);
		assert.equal(result.out, 'codex 1.0 (library)\n');
		assert.equal(result.opens, 0);
	}
});
