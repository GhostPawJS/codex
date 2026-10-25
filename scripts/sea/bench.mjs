// Cold-start benchmark for the SEA binary. Usage:
//   node scripts/sea/bench.mjs <label>=<command...> [more]   (command split on spaces)
// Prints median and p90 in ms over RUNS (default 21) for: --version, --help,
// a write (remember_belief into a fresh db), a read (search_codex), and
// mcp initialize + tools/list, plus mcp initialize + a first search call.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const RUNS = Number(process.env.RUNS ?? 21);
const stats = (xs) => {
	const s = [...xs].sort((a, b) => a - b);
	return { median: s[Math.floor(s.length / 2)], p90: s[Math.floor(s.length * 0.9)] };
};
const time = (cmd, args) => {
	const t = performance.now();
	const r = spawnSync(cmd, args, { encoding: 'utf8' });
	const ms = performance.now() - t;
	if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}: ${r.stderr}`);
	return ms;
};
const mcp = (cmd, args, lines, waitForId) =>
	new Promise((resolve, reject) => {
		const t = performance.now();
		const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'inherit'] });
		let out = '';
		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (chunk) => {
			out += chunk;
			for (const line of out.split('\n')) {
				if (!line.trim()) continue;
				try {
					if (JSON.parse(line).id === waitForId) {
						const ms = performance.now() - t;
						// Wait for exit so Windows releases the db file before cleanup.
						child.once('exit', () => resolve(ms));
						child.stdin.end();
						child.kill();
						return;
					}
				} catch {}
			}
		});
		child.on('error', reject);
		for (const line of lines) child.stdin.write(`${JSON.stringify(line)}\n`);
	});
const init = [
	{
		jsonrpc: '2.0',
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: '2025-06-18',
			capabilities: {},
			clientInfo: { name: 'bench', version: '0' },
		},
	},
	{ jsonrpc: '2.0', method: 'notifications/initialized' },
];
const results = {};
for (const spec of process.argv.slice(2)) {
	const eq = spec.indexOf('=');
	const label = spec.slice(0, eq);
	const [cmd, ...pre] = spec.slice(eq + 1).split(' ');
	const dir = mkdtempSync(join(tmpdir(), 'seabench-'));
	const db = join(dir, 'codex.db');
	const s = { version: [], help: [], write: [], read: [], mcpList: [], mcpSearch: [] };
	time(cmd, [...pre, '--version']); // warm the page cache once
	for (let i = 0; i < RUNS; i++) {
		s.version.push(time(cmd, [...pre, '--version']));
		s.help.push(time(cmd, [...pre, '--help']));
		s.write.push(
			time(cmd, [
				...pre,
				'--db',
				db,
				'remember_belief',
				'--claim',
				`bench claim ${i}`,
				'--source',
				'observed',
				'--category',
				'fact',
			]),
		);
		s.read.push(time(cmd, [...pre, '--db', db, 'search_codex', '--query', 'bench']));
		s.mcpList.push(
			await mcp(
				cmd,
				[...pre, 'mcp', '--db', db],
				[...init, { jsonrpc: '2.0', id: 2, method: 'tools/list' }],
				2,
			),
		);
		s.mcpSearch.push(
			await mcp(
				cmd,
				[...pre, 'mcp', '--db', db],
				[
					...init,
					{
						jsonrpc: '2.0',
						id: 3,
						method: 'tools/call',
						params: { name: 'search_codex', arguments: { query: 'bench' } },
					},
				],
				3,
			),
		);
	}
	rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
	results[label] = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, stats(v)]));
}
const keys = ['version', 'help', 'write', 'read', 'mcpList', 'mcpSearch'];
console.log(`| build | ${keys.join(' | ')} |`);
console.log(`|---|${keys.map(() => '---').join('|')}|`);
for (const [label, r] of Object.entries(results))
	console.log(
		`| ${label} | ${keys.map((k) => `${r[k].median.toFixed(1)} (p90 ${r[k].p90.toFixed(1)})`).join(' | ')} |`,
	);
