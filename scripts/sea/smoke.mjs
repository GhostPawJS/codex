// Smoke test for a built SEA binary: version, a SQLite write and read, and an
// MCP initialize + tools/list round trip over stdio.
//   node scripts/sea/smoke.mjs [path-to-binary]   (default: this host's build in dist-sea/)
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`;
const binary = resolve(
	process.argv[2] ?? `dist-sea/${host}/ghostpaw-codex${process.platform === 'win32' ? '.exe' : ''}`,
);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'sea-smoke-'));
const db = join(dir, 'codex.db');
const fail = (message) => {
	console.error(`smoke: ${message}`);
	process.exit(1);
};
const run = (args) => {
	const r = spawnSync(binary, args, { encoding: 'utf8' });
	if (r.status !== 0) fail(`${args.join(' ')} exited ${r.status}\n${r.stderr}`);
	if (r.stderr.trim()) fail(`${args.join(' ')} wrote to stderr:\n${r.stderr}`);
	return r.stdout;
};

const version = run(['--version']).trim();
const expectedVersion = `ghostpaw-codex ${pkg.version} (binary, ${host})`;
if (version !== expectedVersion) fail(`--version printed ${version}, expected ${expectedVersion}`);
run(['--help']);
const wrote = JSON.parse(
	run([
		'--db',
		db,
		'remember_belief',
		'--claim',
		'The binary runs node:sqlite',
		'--source',
		'observed',
		'--category',
		'fact',
	]),
);
if (!wrote.ok) fail(`write failed: ${JSON.stringify(wrote)}`);
const read = JSON.parse(run(['--db', db, 'search_codex', '--query', 'sqlite']));
if (read.data?.results?.length !== 1) fail(`read failed: ${JSON.stringify(read)}`);

const added = JSON.parse(
	run([
		'belief',
		'add',
		'Noun verb smoke marker',
		'--source',
		'explicit',
		'--category',
		'fact',
		'--db',
		db,
		'--json',
	]),
);
if (!added.ok) fail('noun-verb add failed');
const found = JSON.parse(run(['search', 'Noun verb smoke marker', '--db', db, '--json']));
if (!found.data?.results?.length) fail('noun-verb search failed');

const tools = await new Promise((done) => {
	const child = spawn(binary, ['mcp', '--db', db], { stdio: ['pipe', 'pipe', 'inherit'] });
	let out = '';
	const timer = setTimeout(() => fail('mcp did not answer within 10 s'), 10_000);
	child.stdout.setEncoding('utf8');
	child.stdout.on('data', (chunk) => {
		out += chunk;
		const line = out.split('\n').find((l) => l.includes('"id":2'));
		if (!line) return;
		clearTimeout(timer);
		const listed = JSON.parse(line).result?.tools ?? [];
		child.once('exit', () => done(listed));
		child.stdin.end();
	});
	const send = (msg) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...msg })}\n`);
	send({
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: '2025-06-18',
			capabilities: {},
			clientInfo: { name: 'smoke', version: '0' },
		},
	});
	send({ method: 'notifications/initialized' });
	send({ id: 2, method: 'tools/list' });
});
if (tools.length === 0) fail('mcp tools/list returned no tools');
rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
console.log(`smoke ok: ${binary} ${version}, sqlite write+read, mcp ${tools.length} tools`);
