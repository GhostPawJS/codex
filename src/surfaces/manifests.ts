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
	/** MCP Bundle release asset for the MCP Registry `mcpb` package type. */
	mcpb?: { url: string; fileSha256: string };
}
export interface ServerPackage {
	registryType: string;
	registryBaseUrl?: string;
	identifier: string;
	version?: string;
	fileSha256?: string;
	transport: { type: string };
	packageArguments?: { type: string; value: string }[];
	environmentVariables: { name: string; description: string; isRequired: boolean }[];
}
export function renderManifests(spec: ManifestSpec) {
	if (spec.description.length > 100)
		throw new Error('MCP Registry description exceeds 100 characters');
	const { name, version, description, author, homepage, repository, license, keywords } = spec;
	const metadata = { name, version, description, author, homepage, repository, license, keywords };
	const transport = { command: 'npx', args: ['-y', `${spec.packageName}@${version}`, 'mcp'] };
	const environmentVariables = spec.environment.map((variable) => ({
		...variable,
		isRequired: false,
	}));
	const mcpbPackages: ServerPackage[] = spec.mcpb
		? [
				{
					registryType: 'mcpb',
					identifier: spec.mcpb.url,
					fileSha256: spec.mcpb.fileSha256,
					transport: { type: 'stdio' },
					environmentVariables,
				},
			]
		: [];
	const packages: ServerPackage[] = [
		{
			registryType: 'npm',
			registryBaseUrl: 'https://registry.npmjs.org',
			identifier: spec.packageName,
			version,
			transport: { type: 'stdio' },
			packageArguments: [{ type: 'positional', value: 'mcp' }],
			environmentVariables,
		},
		...mcpbPackages,
	];
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
			packages,
		},
	};
}

export interface McpbManifestSpec {
	name: string;
	title: string;
	version: string;
	description: string;
	longDescription: string;
	author: { name: string; email?: string; url?: string };
	repository: string;
	homepage: string;
	documentation: string;
	support: string;
	license: string;
	keywords: string[];
	entryPoint: string;
	env: Record<string, string>;
	userConfig: Record<
		string,
		{ type: 'string'; title: string; description: string; required: boolean; default: string }
	>;
	tools: readonly { name: string; description: string }[];
}
export function renderMcpbManifest(spec: McpbManifestSpec) {
	return {
		manifest_version: '0.3',
		name: spec.name,
		display_name: spec.title,
		version: spec.version,
		description: spec.description,
		long_description: spec.longDescription,
		author: spec.author,
		repository: { type: 'git', url: spec.repository },
		homepage: spec.homepage,
		documentation: spec.documentation,
		support: spec.support,
		license: spec.license,
		keywords: spec.keywords,
		server: {
			type: 'node',
			entry_point: spec.entryPoint,
			mcp_config: { command: 'node', args: [`\${__dirname}/${spec.entryPoint}`], env: spec.env },
		},
		user_config: spec.userConfig,
		tools: spec.tools,
		compatibility: { platforms: ['darwin', 'win32', 'linux'], runtimes: { node: '>=24.0.0' } },
	};
}
