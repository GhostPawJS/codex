import assert from 'node:assert/strict';
export const packageName = '@ghostpaw/codex';
export const publicEntries = ['.', './mcp'];
export const binName = 'ghostpaw-codex';
export const extraFiles = ['skills/codex/SKILL.md'];
export const entries = {
	full: `export * from './dist/index.js';`,
	tools: `import {tools} from './dist/index.js'; export const registry = tools.codexTools;`,
	'read-write': `export {read, write} from './dist/index.js';`,
	mcp: `export * from './dist/mcp.js';`,
	cli: { entryPoints: ['dist/cli.js'] },
};
export const claim = {
	claim: 'Mira prefers jasmine tea during planning',
	source: 'explicit',
	category: 'preference',
};
export const search = { query: 'jasmine tea' };
export const modernMeta = {
	'io.modelcontextprotocol/protocolVersion': '2026-07-28',
	'io.modelcontextprotocol/clientCapabilities': {},
};
export const discover = {
	jsonrpc: '2.0',
	id: 4,
	method: 'server/discover',
	params: { _meta: modernMeta },
};
export const searchRequest = {
	jsonrpc: '2.0',
	id: 5,
	method: 'tools/call',
	params: { name: 'search_codex', arguments: search, _meta: modernMeta },
};
export const legacyRequests = [
	{
		jsonrpc: '2.0',
		id: 1,
		method: 'initialize',
		params: {
			protocolVersion: '2025-11-25',
			capabilities: {},
			clientInfo: { name: 'guard', version: '1' },
		},
	},
	{ jsonrpc: '2.0', id: 2, method: 'tools/list' },
	{
		jsonrpc: '2.0',
		id: 3,
		method: 'tools/call',
		params: { name: 'search_codex', arguments: search },
	},
];
export const cliRemember = ['call', 'remember_belief', JSON.stringify(claim)];
export const cliSearch = ['call', 'search_codex', JSON.stringify(search)];
export function assertApi(root, mcp) {
	for (const key of ['initCodexTables', 'read', 'write', 'tools']) assert.ok(root[key], key);
	assert.equal(typeof mcp.createCodexMcpServer, 'function');
}
export function smokeLibrary(api, db) {
	api.initCodexTables(db);
	const item = api.write.remember(db, claim);
	assert.ok(api.read.recall(db, search.query).some((value) => value.id === item.id));
}
export const typeConsumer = `import {DatabaseSync} from 'node:sqlite';
import {initCodexTables, read, write} from '${packageName}';
import {createCodexMcpServer} from '${packageName}/mcp';
const db = new DatabaseSync(':memory:'); initCodexTables(db);
write.remember(db, {claim: 'Tea is warm', source: 'explicit', category: 'fact'});
read.recall(db, 'tea'); createCodexMcpServer({db});`;
export function createServer(mcp, db) {
	return mcp.createCodexMcpServer({ db });
}
export function hotPaths(api, db, server) {
	return {
		'write.remember': (i) =>
			api.write.remember(db, {
				...claim,
				claim: `Mira schedules project iteration ${i} with jasmine tea`,
			}),
		'read.recall': () => api.read.recall(db, 'jasmine tea'),
		search_codex: () => api.tools.searchCodexToolHandler(db, search),
		inspect_codex_item: () => api.tools.inspectCodexItemToolHandler(db, { beliefId: 5000 }),
		review_codex: () => api.tools.reviewCodexToolHandler(db, { view: 'status' }),
		'MCP tools/call': () => server.handleLine(JSON.stringify(searchRequest)),
	};
}
export function seedClaim(i, random) {
	const people = ['Mira', 'Theo', 'Aya', 'Leon', 'Nora', 'Sam'];
	const topics = [
		'jasmine tea',
		'database backups',
		'release planning',
		'garden watering',
		'train travel',
		'code review',
		'accessibility',
		'solar power',
	];
	const actions = ['prefers', 'reviews', 'documents', 'schedules', 'measures', 'recommends'];
	return {
		claim: `${people[Math.floor(random() * people.length)]} ${actions[Math.floor(random() * actions.length)]} ${topics[Math.floor(random() * topics.length)]} for project ${i} every ${1 + Math.floor(random() * 28)} days`,
		source: 'explicit',
		category: 'fact',
	};
}

export function consumerSmoke(configUrl) {
	return `import {createRequire} from 'node:module'; import {DatabaseSync} from 'node:sqlite';
 import {assertApi,smokeLibrary} from ${JSON.stringify(configUrl)};
 const require = createRequire(import.meta.url);
 const root = await import(${JSON.stringify(packageName)}); const mcp = await import(${JSON.stringify(`${packageName}/mcp`)});
 assertApi(root,mcp); assertApi(require(${JSON.stringify(packageName)}),require(${JSON.stringify(`${packageName}/mcp`)}));
 const db = new DatabaseSync(':memory:'); try {smokeLibrary(root,db);} finally {db.close();}`;
}
export function assertRoundTrip(remembered, searched) {
	assert.equal(remembered.outcome, 'success');
	assert.ok(searched.data.results.some((item) => item.id === remembered.data.belief.id));
}
export function assertMcpReplies(replies, remembered) {
	assert.ok(replies[1].result.tools.some((tool) => tool.name === 'search_codex'));
	assert.ok(
		replies[2].result.structuredContent.data.results.some(
			(item) => item.id === remembered.data.belief.id,
		),
	);
	assert.equal(replies[3].result.resultType, 'complete');
}
