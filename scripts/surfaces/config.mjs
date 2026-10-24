import { readFileSync } from 'node:fs';
import { codexSkills } from '../../src/skills/skill_registry.ts';
import { codexSkillSpec } from '../../src/surface/codex_skill_spec.ts';
import { codexSurfaceTools } from '../../src/surface/codex_surface_tools.ts';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
export const config = {
	slug: 'codex',
	skill: codexSkillSpec,
	workflows: codexSkills,
	manifest: {
		name: 'ghostpaw-codex',
		version: pkg.version,
		description:
			'Local belief and memory engine with evidence, certainty, and honest revision history.',
		author: pkg.author,
		homepage: pkg.homepage,
		repository: pkg.repository.url,
		license: pkg.license,
		keywords: pkg.keywords,
		server: 'ghostpaw-codex',
		packageName: pkg.name,
		mcpName: 'io.github.GhostPawJS/codex',
		title: 'GhostPaw Codex',
		websiteUrl: pkg.homepage,
		environment: [
			{
				name: 'GHOSTPAW_CODEX_DB',
				description: 'SQLite database path (default: ~/.ghostpaw/codex.db)',
			},
		],
	},
};

export const mcpbSpec = {
	...config.manifest,
	longDescription:
		'Local belief and memory engine with evidence, certainty, and revision history. Stores data in a local SQLite database.',
	documentation: 'https://github.com/GhostPawJS/codex/blob/main/README.md',
	support: pkg.bugs.url,
	entryPoint: 'server/mcp-server.js',
	env: { GHOSTPAW_CODEX_DB: `\${user_config.db_path}` },
	userConfig: {
		db_path: {
			type: 'string',
			title: 'Database path',
			description: 'Path to the local SQLite database.',
			required: false,
			default: `\${HOME}/.ghostpaw/codex.db`,
		},
	},
	tools: codexSurfaceTools.map(({ name, description }) => ({ name, description })),
};
