import { readFileSync } from 'node:fs';
import { codexSkills } from '../../src/skills/skill_registry.ts';
import { codexSkillSpec } from '../../src/surface/codex_skill_spec.ts';

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
		websiteUrl: 'https://ghostpawjs.github.io/codex',
		environment: [
			{
				name: 'GHOSTPAW_CODEX_DB',
				description: 'SQLite database path (default: ~/.ghostpaw/codex.db)',
			},
		],
	},
};
