import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type ManifestSpec, renderManifests } from './manifests.ts';

const spec: ManifestSpec = {
	name: 'example',
	version: '1.2.3',
	description: 'A tool server',
	author: { name: 'Author' },
	homepage: 'https://example.com',
	repository: 'https://github.com/example/example',
	license: 'MIT',
	keywords: ['mcp'],
	server: 'example',
	packageName: '@example/example',
	mcpName: 'io.github.example/example',
	title: 'Example',
	environment: [{ name: 'EXAMPLE_DB', description: 'Database' }],
};
test('manifest formats retain exact package versions and transport commands', () => {
	const result = renderManifests(spec);
	assert.deepEqual(result.mcp.mcpServers.example, {
		type: 'stdio',
		command: 'npx',
		args: ['-y', '@example/example@1.2.3', 'mcp'],
	});
	assert.deepEqual(result.claudePlugin.mcpServers.example, {
		command: 'npx',
		args: ['-y', '@example/example@1.2.3', 'mcp'],
	});
	assert.equal(result.server.name, spec.mcpName);
	assert.deepEqual(result.server.packages[0]?.packageArguments, [
		{ type: 'positional', value: 'mcp' },
	]);
	assert.deepEqual(result.server.packages[0]?.environmentVariables, [
		{ name: 'EXAMPLE_DB', description: 'Database', isRequired: false },
	]);
	assert.equal(result.claudeMarketplace.plugins[0]?.source, './');
	assert.equal(result.plugin.repository, spec.repository);
	assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
	assert.throws(() => renderManifests({ ...spec, description: 'x'.repeat(101) }));
});
