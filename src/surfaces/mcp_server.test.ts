import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMcpServer, MCP_SUPPORTED_PROTOCOL_VERSIONS } from './mcp_server.ts';
import type { SurfaceTool } from './surface_types.ts';

const tools: SurfaceTool<number>[] = [
	{
		name: 'echo',
		description: 'Echo',
		whenToUse: 'testing',
		whenNotToUse: 'production',
		readOnly: true,
		inputSchema: { type: 'object', properties: { n: { type: 'integer' } }, required: ['n'] },
		handler: (ctx, input) => ({ ok: input.n !== 0, n: input.n, ctx }),
	},
	{
		name: 'throw',
		description: 'Throws',
		inputSchema: { type: 'object' },
		handler: () => {
			throw new Error('boom');
		},
	},
];
const meta = {
	'io.modelcontextprotocol/protocolVersion': '2026-07-28',
	'io.modelcontextprotocol/clientCapabilities': {},
};
function fixture() {
	let calls = 0;
	const server = createMcpServer({
		name: 'test',
		version: '1',
		instructions: 'test instructions',
		tools,
		context: () => ++calls,
	});
	const request = async (method: string, params: object = {}) =>
		JSON.parse(
			(await server.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }))) ??
				'null',
		);
	return { server, request, calls: () => calls };
}
test('modern discover, list and calls require no handshake and open context lazily', async () => {
	const f = fixture();
	const discover = await f.request('server/discover', { _meta: meta });
	assert.deepEqual(discover.result.supportedVersions, MCP_SUPPORTED_PROTOCOL_VERSIONS);
	assert.equal(discover.result.cacheScope, 'public');
	assert.equal(discover.result.resultType, 'complete');
	assert.deepEqual(discover.result._meta['io.modelcontextprotocol/serverInfo'], {
		name: 'test',
		version: '1',
	});
	const list = await f.request('tools/list', { _meta: meta });
	assert.equal(list.result.tools[0].annotations.readOnlyHint, true);
	assert.match(list.result.tools[0].description, /Use when: testing\nNot for: production/);
	assert.equal(f.calls(), 0);
	assert.equal(
		(await f.request('tools/call', { _meta: meta, name: 'echo', arguments: { n: 'bad' } })).result
			.isError,
		true,
	);
	assert.equal(f.calls(), 0);
	for (const n of [1, 0]) {
		const value = await f.request('tools/call', { _meta: meta, name: 'echo', arguments: { n } });
		assert.equal(value.result.isError, n === 0);
		assert.equal(value.result.structuredContent.ctx, 1);
		assert.deepEqual(JSON.parse(value.result.content[0].text), value.result.structuredContent);
	}
	assert.equal(f.calls(), 1);
	assert.match(
		(await f.request('tools/call', { _meta: meta, name: 'throw' })).result.content[0].text,
		/boom/,
	);
});
test('all legacy versions negotiate and retain legacy semantics', async () => {
	for (const version of [...MCP_SUPPORTED_PROTOCOL_VERSIONS.slice(1), 'future']) {
		const f = fixture();
		const init = await f.request('initialize', { protocolVersion: version });
		assert.equal(init.result.protocolVersion, version === 'future' ? '2025-11-25' : version);
		assert.deepEqual(init.result.capabilities, { tools: { listChanged: false } });
		assert.equal(
			await f.server.handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }),
			undefined,
		);
		assert.deepEqual((await f.request('ping')).result, {});
		assert.equal((await f.request('tools/list')).result.tools.length, 2);
		assert.equal(f.calls(), 0);
		assert.equal(
			(await f.request('tools/call', { name: 'echo', arguments: { n: 1 } })).result.isError,
			false,
		);
	}
});
test('protocol errors and silent notifications', async () => {
	const f = fixture();
	assert.equal((await f.request('tools/list')).error.code, -32602);
	assert.match((await f.request('tools/list')).error.message, /2026-07-28/);
	const unsupported = await f.request('tools/list', {
		_meta: { ...meta, 'io.modelcontextprotocol/protocolVersion': 'future' },
	});
	assert.equal(unsupported.error.code, -32022);
	assert.deepEqual(unsupported.error.data, {
		supported: [...MCP_SUPPORTED_PROTOCOL_VERSIONS],
		requested: 'future',
	});
	assert.equal((await f.request('missing', { _meta: meta })).error.code, -32601);
	assert.equal(
		(await f.request('tools/call', { _meta: meta, name: 'missing' })).error.code,
		-32602,
	);
	assert.equal(
		(
			await f.request('tools/list', {
				_meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' },
			})
		).error.code,
		-32602,
	);
	assert.equal(JSON.parse((await f.server.handleLine('{')) ?? '').error.code, -32700);
	for (const value of [
		null,
		[],
		1,
		{ jsonrpc: '1.0', method: 'ping' },
		{ jsonrpc: '2.0', method: 1 },
	])
		assert.equal(
			JSON.parse(JSON.stringify(await f.server.handleMessage(value))).error.code,
			-32600,
		);
	for (const method of ['notifications/cancelled', 'missing', 'tools/call'])
		assert.equal(await f.server.handleMessage({ jsonrpc: '2.0', method }), undefined);
});

test('custom result error predicate overrides default and null arguments are invalid', async () => {
	const server = createMcpServer({
		name: 'test',
		version: '1',
		tools,
		context: () => 1,
		isErrorResult: () => true,
	});
	const call = (input: unknown) =>
		server.handleMessage({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: { _meta: meta, name: 'echo', arguments: input },
		});
	const success = JSON.parse(JSON.stringify(await call({ n: 1 })));
	assert.equal(success.result.isError, true);
	const invalid = JSON.parse(JSON.stringify(await call(null)));
	assert.match(invalid.result.content[0].text, /expected object/);
});
