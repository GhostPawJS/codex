import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { budgets, gate, update, updating } from './common.mjs';
import { binName, discover } from './config.mjs';
import { median, run, session } from './process.mjs';
export async function coldStarts(db = ':memory:', firstSearch) {
	const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
	const cli = pkg.bin[binName];
	const results = {};
	for (const [name, args] of Object.entries({
		version: ['--version'],
		tools: ['tools'],
		mcp: null,
		'mcp-server': null,
		...(firstSearch ? { 'mcp-search': null } : {}),
	})) {
		const samples = [];
		for (let i = 0; i < 7; i++) {
			const start = performance.now();
			if (args) run(process.execPath, [cli, ...args]);
			else
				await session(
					process.execPath,
					name === 'mcp-server' ? ['dist/mcp-server.js', '--db', db] : [cli, 'mcp', '--db', db],
					name === 'mcp-search' ? [firstSearch] : [discover],
				);
			samples.push(performance.now() - start);
		}
		results[name] = { medianMs: median(samples), samples };
	}
	return results;
}
if (process.argv[1]?.endsWith('/startup.mjs')) {
	const measured = await coldStarts();
	if (updating)
		update(
			'startup',
			Object.fromEntries(
				Object.entries(measured).map(([name, value]) => [
					name,
					{ medianMs: Math.max(150, Math.ceil(value.medianMs * 3)) },
				]),
			),
		);
	else
		gate(
			Object.entries(measured).map(([name, value]) => ({
				name,
				medianMs: value.medianMs,
				limit: budgets.startup?.[name]?.medianMs,
				status: value.medianMs <= budgets.startup?.[name]?.medianMs ? 'PASS' : 'FAIL',
			})),
		);
}
