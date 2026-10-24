import { codexSkills } from '../skills/skill_registry.ts';
import { codexSoulTraits } from '../soul.ts';
import { codexMcpInstructions } from './codex_mcp_instructions.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';

export const codexSkillSpec = {
	name: 'codex',
	description:
		'Store, search, and revise local beliefs with evidence and revision history. Use when recalling preferences, capturing knowledge, or maintaining agent memory.',
	license: 'MIT',
	compatibility: 'Node.js 24 or newer. MCP stdio or ghostpaw-codex CLI.',
	bin: 'ghostpaw-codex',
	packageName: '@ghostpaw/codex',
	server: 'ghostpaw-codex',
	about: codexMcpInstructions,
	tools: codexSurfaceTools,
	workflows: codexSkills,
	principles: codexSoulTraits.map((trait) => trait.principle),
};
