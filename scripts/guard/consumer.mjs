import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import {
	assertMcpReplies,
	assertRoundTrip,
	binName,
	cliRemember,
	cliSearch,
	consumerSmoke,
	discover,
	extraFiles,
	legacyRequests,
	packageName,
	publicEntries,
	typeConsumer,
} from './config.mjs';
import { run, session } from './process.mjs';

const root = process.cwd();
run(process.execPath, ['scripts/mcpb/build.mjs', '--stage-only']);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const temp = mkdtempSync(join(tmpdir(), 'library-consumer-'));
try {
	const [pack] = JSON.parse(
		run('npm', [
			'pack',
			'--json',
			'--ignore-scripts',
			'--pack-destination',
			temp,
			'--cache',
			join(temp, 'cache'),
		]),
	);
	const files = pack.files.map((file) => file.path);
	assert.ok(
		pack.files.find((file) => file.path === pkg.bin[binName].replace(/^\.\//, '')).mode & 0o111,
		'Packed CLI must be executable',
	);
	const required = [
		'README.md',
		'LICENSE',
		'package.json',
		...extraFiles,
		...readdirSync('skills/codex/references').map((name) => `skills/codex/references/${name}`),
		...Object.values(pkg.bin),
		...publicEntries.flatMap((key) => {
			const entry = pkg.exports[key];
			return [entry.import.default, entry.import.types, entry.require.default];
		}),
		pkg.bin[binName],
	].map((file) => file.replace(/^\.\//, ''));
	for (const file of required) assert.ok(files.includes(file), `Missing ${file}`);
	for (const file of files)
		assert.ok(!/^(src|demo|scripts)\/|\.test\./.test(file), `Unexpected ${file}`);
	writeFileSync(join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
	run(
		'npm',
		[
			'install',
			join(temp, pack.filename),
			'--offline',
			'--no-audit',
			'--no-fund',
			'--ignore-scripts',
			'--cache',
			join(temp, 'cache'),
		],
		{ cwd: temp },
	);
	const modules = join(temp, 'node_modules');
	const installed = join(modules, packageName);
	const allowed = new Set([packageName, '.bin', '.package-lock.json']);
	const installedNames = readdirSync(modules).flatMap((name) =>
		name.startsWith('@')
			? readdirSync(join(modules, name)).map((child) => `${name}/${child}`)
			: [name],
	);
	assert.deepEqual(
		installedNames.filter((name) => !allowed.has(name)),
		[],
	);
	const lock = JSON.parse(readFileSync(join(temp, 'package-lock.json'), 'utf8'));
	assert.deepEqual(Object.keys(lock.packages).sort(), ['', `node_modules/${packageName}`].sort());
	const cli = join(installed, pkg.bin[binName]);
	assert.ok(readFileSync(cli, 'utf8').startsWith('#!/usr/bin/env node\n'));
	assert.ok(statSync(cli).mode & 0o111);
	// Parse imports with TypeScript, covering static exports/imports and literal dynamic imports/requires.
	function scan(dir) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const file = join(dir, entry.name);
			if (entry.isDirectory()) {
				scan(file);
				continue;
			}
			if (!/\.(js|cjs)$/.test(entry.name)) continue;
			const source = ts.createSourceFile(
				file,
				readFileSync(file, 'utf8'),
				ts.ScriptTarget.Latest,
				true,
				ts.ScriptKind.JS,
			);
			function visit(node) {
				let specifier;
				if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
					specifier = node.moduleSpecifier;
				if (
					ts.isCallExpression(node) &&
					(node.expression.kind === ts.SyntaxKind.ImportKeyword ||
						(ts.isIdentifier(node.expression) && node.expression.text === 'require'))
				) {
					assert.ok(
						node.arguments.length && ts.isStringLiteralLike(node.arguments[0]),
						`Nonliteral import/require in ${file}`,
					);
					specifier = node.arguments[0];
				}
				if (specifier && ts.isStringLiteralLike(specifier)) {
					const name = specifier.text;
					assert.ok(
						name.startsWith('.') ||
							(name.startsWith('node:') && isBuiltin(name)) ||
							name === packageName ||
							name.startsWith(`${packageName}/`),
						`External dependency ${name} in ${file}`,
					);
				}
				ts.forEachChild(node, visit);
			}
			visit(source);
		}
	}
	scan(join(installed, 'dist'));
	const configUrl = new URL('./config.mjs', import.meta.url).href;
	const smoke = consumerSmoke(configUrl);
	writeFileSync(join(temp, 'smoke.mjs'), smoke);
	run(process.execPath, [join(temp, 'smoke.mjs')], { cwd: temp });
	for (const extension of ['mts', 'cts'])
		writeFileSync(join(temp, `consumer.${extension}`), typeConsumer);
	writeFileSync(
		join(temp, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				module: 'NodeNext',
				moduleResolution: 'NodeNext',
				strict: true,
				noEmit: true,
				target: 'ES2024',
				types: ['node'],
				typeRoots: [resolve('node_modules/@types')],
			},
			files: ['consumer.mts', 'consumer.cts'],
		}),
	);
	run(
		process.execPath,
		[join(root, 'node_modules/typescript/bin/tsc'), '-p', join(temp, 'tsconfig.json')],
		{ cwd: temp },
	);
	const bin = join(modules, '.bin', binName);
	assert.equal(run(bin, ['--version']).trim(), pkg.version);
	const db = join(temp, 'smoke.db');
	const remembered = JSON.parse(run(bin, ['--db', db, ...cliRemember]));
	const searched = JSON.parse(run(bin, ['--db', db, ...cliSearch]));
	assertRoundTrip(remembered, searched);
	const { replies } = await session(bin, ['mcp', '--db', db], [...legacyRequests, discover]);
	assertMcpReplies(replies, remembered);
	// `npx -y @ghostpaw/codex ...` (registry, mcp.json, README) only works while npm can
	// pick the executable: a single bin, or one named after the unscoped package.
	const binNames = Object.keys(pkg.bin);
	assert.ok(
		binNames.length === 1 || binNames.includes(packageName.replace(/^@[^/]+\//, '')),
		`npx ${packageName} cannot pick an executable from bins: ${binNames.join(', ')}`,
	);
	const npx = join(dirname(process.execPath), 'npx');
	assert.equal(
		run(npx, ['--no-install', packageName, '--version'], { cwd: temp }).trim(),
		pkg.version,
	);
	const packedServer = pack.files.find((file) => file.path === 'dist/mcp-server.js');
	assert.ok(packedServer.mode & 0o111);
	const { replies: dedicatedReplies } = await session(
		process.execPath,
		[join(modules, packageName, 'dist/mcp-server.js'), '--db', ':memory:'],
		legacyRequests.slice(0, 2),
	);
	assert.equal(dedicatedReplies[0].result.protocolVersion, '2025-11-25');
	assert.ok(dedicatedReplies[1].result.tools.some((tool) => tool.name === 'search_codex'));
	console.log(
		`Consumer: ESM, CJS, NodeNext types, CLI, SQLite and MCP pass. Tarball ${pack.size} bytes; unpacked ${pack.unpackedSize} bytes.`,
	);
} finally {
	rmSync(temp, { recursive: true, force: true });
}
