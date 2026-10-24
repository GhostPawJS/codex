import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type ManifestSpec, renderManifests, renderMcpbManifest } from './manifests.ts';

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

test('MCPB manifest retains portable paths and user configuration', () => {
	const result = renderMcpbManifest({
		...spec,
		longDescription: 'Long description',
		documentation: 'https://example.com/docs',
		support: 'https://example.com/issues',
		entryPoint: 'server/main.js',
		env: { EXAMPLE_DB: `\${user_config.db}` },
		userConfig: {
			db: {
				type: 'string',
				title: 'Database',
				description: 'Local database',
				required: false,
				default: `\${HOME}/example.db`,
			},
		},
		tools: [{ name: 'find', description: 'Find records' }],
	});
	assert.equal(result.manifest_version, '0.3');
	assert.deepEqual(result.server.mcp_config, {
		command: 'node',
		args: [`\${__dirname}/server/main.js`],
		env: { EXAMPLE_DB: `\${user_config.db}` },
	});
	assert.equal(result.user_config.db?.default, `\${HOME}/example.db`);
	assert.deepEqual(result.tools, [{ name: 'find', description: 'Find records' }]);
	assert.deepEqual(result.compatibility.runtimes, { node: '>=24.0.0' });
});
