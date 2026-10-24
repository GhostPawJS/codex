import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { session } from '../guard/process.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
function run(command, args) {
	const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
}
const stageOnly = process.argv.includes('--stage-only');
if (!stageOnly) run('npm', ['run', 'build']);
const buildRoot = join(root, '.mcpb-build');
mkdirSync(buildRoot, { recursive: true });
const stage = mkdtempSync(join(buildRoot, 'stage-'));
mkdirSync(join(stage, 'server'));
copyFileSync(join(root, 'mcpb/manifest.json'), join(stage, 'manifest.json'));
copyFileSync(join(root, 'dist/mcp-server.js'), join(stage, 'server/mcp-server.js'));
writeFileSync(join(stage, 'package.json'), '{"type":"module"}\n');
const manifest = JSON.parse(readFileSync(join(stage, 'manifest.json'), 'utf8'));
assert.equal(manifest.server.entry_point, 'server/mcp-server.js');
assert.ok(
	readFileSync(resolve(stage, manifest.server.entry_point), 'utf8').startsWith(
		'#!/usr/bin/env node\n',
	),
);
if (stageOnly) {
	const { replies } = await session(
		process.execPath,
		[join(stage, manifest.server.entry_point), '--db', ':memory:'],
		[
			{
				jsonrpc: '2.0',
				id: 1,
				method: 'initialize',
				params: {
					protocolVersion: '2025-11-25',
					capabilities: {},
					clientInfo: { name: 'stage', version: '1' },
				},
			},
			{ jsonrpc: '2.0', id: 2, method: 'tools/list' },
		],
		{ cwd: stage },
	);
	assert.ok(replies.find((reply) => reply.id === 1)?.result.serverInfo);
	assert.equal(replies.find((reply) => reply.id === 2)?.result.tools.length, manifest.tools.length);
}
console.log(`MCPB staged: ${stage}`);
if (!stageOnly) {
	run('npx', ['-y', '@anthropic-ai/mcpb@2.1.2', 'validate', join(stage, 'manifest.json')]);
	run('npx', ['-y', '@anthropic-ai/mcpb@2.1.2', 'pack', stage, join(root, 'server.mcpb')]);
}
