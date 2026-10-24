#!/usr/bin/env node
// Fails when the published package would pull in anything at install or run time:
// non-empty dependencies / optionalDependencies / peerDependencies / bundleDependencies in package.json,
// node_modules inside the packed tarball, or a packed JS file importing a bare specifier
// that is not a Node.js built-in. Run after `npm run build`.
// Usage: node scripts/check-zero-deps.mjs [--allow name1,name2]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join } from 'node:path';

const argIndex = process.argv.indexOf('--allow');
const allowed = new Set(
	argIndex > -1 ? (process.argv[argIndex + 1] ?? '').split(',').filter(Boolean) : [],
);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const problems = [];

for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
	for (const name of Object.keys(pkg[field] ?? {})) {
		if (!allowed.has(name)) problems.push(`package.json ${field} lists "${name}"`);
	}
}
for (const field of ['bundleDependencies', 'bundledDependencies']) {
	const value = pkg[field];
	if (value === true || (Array.isArray(value) && value.length > 0))
		problems.push(`package.json sets ${field}`);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const [packed] = JSON.parse(
	execFileSync(npm, ['pack', '--dry-run', '--json', '--ignore-scripts'], {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
	}),
);
const builtins = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));
const packageName = /^(?:node:)?(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(?:\/[\w.@-]+)*$/;
const specifier =
	/(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)["']([^"'\n]+)["']/gm;

for (const { path } of packed.files) {
	if (path.split('/').includes('node_modules')) problems.push(`tarball contains ${path}`);
	if (!/\.(c|m)?js$/.test(path)) continue;
	const source = readFileSync(join(process.cwd(), path), 'utf8');
	for (const match of source.matchAll(specifier)) {
		const spec = match[1];
		if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('data:')) continue;
		if (!packageName.test(spec)) continue; // text inside strings or templates, not a module specifier
		const base = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
		if (builtins.has(spec) || builtins.has(base) || spec.startsWith('node:')) continue;
		if (allowed.has(base)) continue;
		problems.push(`${path} imports "${spec}"`);
	}
}

if (problems.length > 0) {
	console.error(`zero-deps check failed for ${pkg.name}@${pkg.version}:`);
	for (const p of [...new Set(problems)]) console.error(`  - ${p}`);
	process.exit(1);
}
const note = allowed.size > 0 ? ` (allowed exceptions: ${[...allowed].join(', ')})` : '';
console.log(
	`zero-deps check passed for ${pkg.name}@${pkg.version}: ${packed.files.length} packed files, no runtime dependencies${note}`,
);
