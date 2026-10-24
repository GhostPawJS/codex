import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareApi, compareBudgets, guardrailChanges } from './ratchet.mjs';

test('budget growth, removal and invalid replacements fail; tightening and additions pass', () => {
	const before = {
		size: { full: { minBytes: 128, gzipBytes: 64 } },
		startup: { mcp: { medianMs: 150 } },
	};
	for (const section of ['size', 'startup']) {
		const name = Object.keys(before[section])[0];
		for (const metric of Object.keys(before[section][name])) {
			const after = structuredClone(before);
			after[section][name][metric]++;
			assert.equal(compareBudgets(before, after).length, 1);
			after[section][name][metric] -= 2;
			assert.deepEqual(compareBudgets(before, after), []);
			delete after[section][name][metric];
			assert.equal(compareBudgets(before, after).length, 1);
		}
	}
	assert.equal(compareBudgets(before, { ...before, size: null }).length, 1);
	assert.equal(compareBudgets({ x: 1 }, { x: NaN }).length, 1);
	assert.deepEqual(compareBudgets(before, { ...before, new: 1 }), []);
});
test('all API changes including additions require approval', () => {
	const before = { fn: { kind: 'function', signature: '(): void' } };
	assert.deepEqual(compareApi(before, structuredClone(before)), []);
	for (const after of [{}, { ...before, extra: {} }, { fn: { kind: 'object' } }])
		assert.equal(compareApi(before, after).length, 1);
});
test('guardrails, deleted and renamed tests, protected scripts', () => {
	const lines = [
		'M\tscripts/guard/size.mjs',
		'M\t.github/workflows/ci.yml',
		'M\tbiome.json',
		'M\ttsconfig.json',
		'D\tsrc/a.test.ts',
		'R100\tsrc/b.test.ts\tsrc/c.ts',
	];
	assert.deepEqual(
		guardrailChanges(
			[...lines, 'A\tsrc/new.test.ts', 'M\tsrc/a.ts'].join('\n'),
			{ check: 'a', build: 'a', surfaces: 'a' },
			{ check: 'b', build: 'b', surfaces: 'b' },
		),
		[...lines, 'package.json scripts.check: a → b', 'package.json scripts.surfaces: a → b'],
	);
});

test('ratchet rejects a temporary budget increase without its commit tag', async () => {
	const { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = await import('node:fs');
	const { tmpdir } = await import('node:os');
	const { join, resolve } = await import('node:path');
	const { run } = await import('./process.mjs');
	const temp = mkdtempSync(join(tmpdir(), 'ratchet-integration-'));
	const script = resolve('scripts/guard/ratchet.mjs');
	try {
		// A read-only git fixture supplies a base tree and commit messages, without creating commits.
		const baseline = { size: { full: { minBytes: 64 } }, startup: { mcp: { medianMs: 150 } } };
		const files = {
			'budgets.json': baseline,
			'api-surface.json': {},
			'package.json': { scripts: {} },
		};
		writeFileSync(join(temp, 'base.json'), JSON.stringify(files));
		for (const [name, value] of Object.entries(files))
			writeFileSync(join(temp, name), `${JSON.stringify(value)}\n`);
		writeFileSync(
			join(temp, 'git'),
			`#!/usr/bin/env node
import {readFileSync} from 'node:fs';
const [command,...args] = process.argv.slice(2);
const files = JSON.parse(readFileSync('base.json','utf8'));
if(command === 'rev-parse') console.log('fixture-base');
else if(command === 'log') {if(process.env.GITHUB_EVENT_PATH && !args.includes('fixture-base..pr-head')) process.exit(2); console.log(process.env.FIXTURE_MESSAGES ?? '');}
else if(command === 'ls-tree') {const file=args.at(-1); if(file in files) console.log(file);}
else if(command === 'show') console.log(JSON.stringify(files[args[0].split(':')[1]]));
else if(command !== 'diff') process.exit(2);
`,
		);
		chmodSync(join(temp, 'git'), 0o755);
		// The wrapper is ESM under this fixture package.
		writeFileSync(join(temp, 'package.json'), JSON.stringify({ type: 'module', scripts: {} }));
		writeFileSync(
			join(temp, 'event.json'),
			JSON.stringify({ pull_request: { head: { sha: 'pr-head' } } }),
		);
		const options = {
			cwd: temp,
			env: {
				...process.env,
				PATH: `${temp}:${process.env.PATH}`,
				GITHUB_EVENT_PATH: join(temp, 'event.json'),
				FIXTURE_MESSAGES: '',
			},
		};
		const changed = structuredClone(baseline);
		changed.size.full.minBytes++;
		writeFileSync(join(temp, 'budgets.json'), JSON.stringify(changed));
		assert.throws(
			() => run(process.execPath, [script, '--base', 'fixture'], options),
			/Requires \[budget-increase-approved\]/,
		);
		run(process.execPath, [script, '--base', 'fixture'], {
			...options,
			env: { ...options.env, FIXTURE_MESSAGES: '[budget-increase-approved]' },
		});
		writeFileSync(join(temp, 'budgets.json'), JSON.stringify(baseline));
		run(process.execPath, [script, '--base', 'fixture'], options);
		assert.deepEqual(JSON.parse(readFileSync(join(temp, 'budgets.json'), 'utf8')), baseline);
		writeFileSync(join(temp, 'api-surface.json'), JSON.stringify({ added: { kind: 'value' } }));
		assert.throws(
			() => run(process.execPath, [script, '--base', 'fixture'], options),
			/Requires \[api-change-approved\]/,
		);
		run(process.execPath, [script, '--base', 'fixture'], {
			...options,
			env: { ...options.env, FIXTURE_MESSAGES: '[api-change-approved]' },
		});
	} finally {
		rmSync(temp, { recursive: true, force: true });
	}
});
