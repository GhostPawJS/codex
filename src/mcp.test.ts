import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { codexMcpInstructions, createCodexMcpServer } from './mcp.ts';
import { codexSkillSpec } from './surface/codex_skill_spec.ts';
import { openCodexDb } from './surface/open_codex_db.ts';
import { renderSkillMarkdown } from './surfaces/skill_markdown.ts';

test('Codex discovery never creates a DB and annotations distinguish hard erasure', async () => {
	const directory = mkdtempSync(join(tmpdir(), 'codex-mcp-'));
	try {
		const path = join(directory, 'missing.db');
		const server = createCodexMcpServer({ dbPath: path });
		const _meta = {
			'io.modelcontextprotocol/protocolVersion': '2026-07-28',
			'io.modelcontextprotocol/clientCapabilities': {},
		};
		await server.handleMessage({
			jsonrpc: '2.0',
			id: 1,
			method: 'server/discover',
			params: { _meta },
		});
		const list = JSON.parse(
			JSON.stringify(
				await server.handleMessage({
					jsonrpc: '2.0',
					id: 2,
					method: 'tools/list',
					params: { _meta },
				}),
			),
		);
		for (const tool of list.result.tools) {
			assert.equal(tool.annotations.destructiveHint, tool.name === 'retire_belief');
			assert.equal(tool.annotations.openWorldHint, false);
		}
		assert.equal(existsSync(path), false);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
test('Codex MCP calls use injected database and leave ownership with caller', async () => {
	const db = await openCodexDb(':memory:');
	try {
		const server = createCodexMcpServer({ db });
		await server.handleMessage({
			jsonrpc: '2.0',
			id: 1,
			method: 'initialize',
			params: { protocolVersion: '2025-11-25' },
		});
		const result = JSON.parse(
			JSON.stringify(
				await server.handleMessage({
					jsonrpc: '2.0',
					id: 2,
					method: 'tools/call',
					params: {
						name: 'remember_belief',
						arguments: { claim: 'Tabs over spaces', source: 'explicit', category: 'preference' },
					},
				}),
			),
		);
		assert.equal(result.result.isError, false);
		assert.ok(db.prepare('SELECT * FROM beliefs').get());
	} finally {
		db.close();
	}
});
test('Codex skill is generated identically and instructions lead with operating principles', () => {
	assert.equal(
		renderSkillMarkdown(codexSkillSpec),
		readFileSync(new URL('../skills/codex/SKILL.md', import.meta.url), 'utf8'),
	);
	assert.ok(codexMcpInstructions.length <= 2000);
	for (const phrase of ['Search before you remember', 'revise', 'retire', 'Certainty is not truth'])
		assert.ok(codexMcpInstructions.slice(0, 500).includes(phrase));
});
