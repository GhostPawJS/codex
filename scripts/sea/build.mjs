// Build the ghostpaw-codex single executable (Node SEA).
//
//   node scripts/sea/build.mjs [--node <path>] [--target <os-arch>] [--mode cache|snapshot|plain] [--out dir]
//
// Needs Node >= 25.5 to run (node --build-sea). The Node binary that gets
// embedded is --node (default: the running node). Its version must equal the
// running node's version. --target only names the output file; it defaults to
// the host. Code cache and snapshot are only valid when the target is the
// host platform, so cross builds fall back to plain mode.
import { execFileSync } from 'node:child_process';
import {
	chmodSync,
	copyFileSync,
	mkdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { build } from 'esbuild';

const { values } = parseArgs({
	options: {
		node: { type: 'string' },
		target: { type: 'string' },
		mode: { type: 'string', default: 'cache' },
		out: { type: 'string', default: 'dist-sea' },
	},
});
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 25 || (major === 25 && minor < 5)) {
	console.error(`node --build-sea needs Node >= 25.5, this is ${process.version}`);
	process.exit(1);
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const bin = Object.keys(pkg.bin)[0];
const host = `${process.platform === 'win32' ? 'windows' : process.platform}-${process.arch}`;
const target = values.target ?? host;
const [os] = target.split('-');
const cross = target !== host;
const mode = cross ? 'plain' : values.mode;
if (!['cache', 'snapshot', 'plain'].includes(mode)) throw new Error(`Unknown --mode ${mode}`);
const out = resolve(values.out);
const work = join(out, `.work-${target}`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

// 1. Bundle to one CommonJS file. Code cache and snapshot need CommonJS.
const main = join(work, 'main.cjs');
await build({
	entryPoints: [mode === 'snapshot' ? 'scripts/sea/snapshot.ts' : 'scripts/sea/main.ts'],
	bundle: true,
	platform: 'node',
	target: `node${major}`,
	format: 'cjs',
	minify: true,
	legalComments: 'none',
	outfile: main,
	logLevel: 'warning',
});
// A SEA main script cannot run import() of builtins inside a snapshot, and a
// plain require() is cheaper anyway. esbuild keeps import('node:x') as is.
const code = readFileSync(main, 'utf8').replace(
	/\bimport\("(node:[a-z_/]+)"\)/g,
	'Promise.resolve().then(()=>require("$1"))',
);
if (/\bimport\("node:/.test(code)) throw new Error('builtin import() left in the bundle');
writeFileSync(main, code);

// 2. Pick the Node binary to embed. On Linux, strip it first: saves ~33 MB.
// Cross builds need a strip that knows the target arch (set STRIP).
let executable = resolve(values.node ?? process.execPath);
if (os === 'linux') {
	const stripped = join(work, 'node');
	copyFileSync(executable, stripped);
	try {
		execFileSync(process.env.STRIP ?? 'strip', [stripped]);
		executable = stripped;
	} catch {
		console.warn('strip failed, embedding the unstripped binary');
	}
}

// 3. node --build-sea
const name = `${bin}${os === 'windows' ? '.exe' : ''}`;
const output = join(out, target, name);
mkdirSync(join(out, target), { recursive: true });
const config = join(work, 'sea-config.json');
writeFileSync(
	config,
	JSON.stringify(
		{
			main,
			output,
			executable,
			disableExperimentalSEAWarning: true,
			useCodeCache: mode === 'cache',
			useSnapshot: mode === 'snapshot',
			// Ignore NODE_OPTIONS from the user's shell: the binary should behave
			// the same everywhere.
			execArgvExtension: 'none',
		},
		null,
		2,
	),
);
execFileSync(process.execPath, ['--build-sea', config], { stdio: 'inherit' });
if (os !== 'windows') chmodSync(output, 0o755);

// 4. macOS needs a signature to run on arm64. Ad-hoc signing works offline.
if (os === 'darwin') {
	if (process.platform === 'darwin') execFileSync('codesign', ['--sign', '-', '--force', output]);
	else console.warn(`${output} is unsigned: run "codesign --sign - ${name}" on macOS before use`);
}
rmSync(work, { recursive: true, force: true });
console.log(`${output} (${mode}, ${(statSync(output).size / 1e6).toFixed(1)} MB)`);
