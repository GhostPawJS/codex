export interface ManifestSpec {
	name: string;
	version: string;
	description: string;
	author: { name: string; email?: string; url?: string };
	homepage: string;
	repository: string;
	license: string;
	keywords: string[];
	server: string;
	packageName: string;
	mcpName: string;
	title: string;
	websiteUrl?: string;
	environment: { name: string; description: string }[];
}
export function renderManifests(spec: ManifestSpec) {
	if (spec.description.length > 100)
		throw new Error('MCP Registry description exceeds 100 characters');
	const { name, version, description, author, homepage, repository, license, keywords } = spec;
	const metadata = { name, version, description, author, homepage, repository, license, keywords };
	const transport = { command: 'npx', args: ['-y', `${spec.packageName}@${version}`, 'mcp'] };
	return {
		plugin: { $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', ...metadata },
		mcp: {
			$schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
			mcpServers: { [spec.server]: { type: 'stdio', ...transport } },
		},
		claudePlugin: { ...metadata, mcpServers: { [spec.server]: transport } },
		claudeMarketplace: {
			name,
			owner: { name: author.name },
			plugins: [{ name, source: './', description }],
		},
		server: {
			$schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
			name: spec.mcpName,
			description,
			title: spec.title,
			version,
			repository: { url: repository, source: 'github' },
			websiteUrl: spec.websiteUrl ?? homepage,
			packages: [
				{
					registryType: 'npm',
					registryBaseUrl: 'https://registry.npmjs.org',
					identifier: spec.packageName,
					version,
					transport: { type: 'stdio' },
					packageArguments: [{ type: 'positional', value: 'mcp' }],
					environmentVariables: spec.environment.map((variable) => ({
						...variable,
						isRequired: false,
					})),
				},
			],
		},
	};
}
