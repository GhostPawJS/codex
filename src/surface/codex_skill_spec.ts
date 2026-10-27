import { codexSkills } from '../skills/skill_registry.ts';
import { codexSoulTraits } from '../soul.ts';
import { codexMcpInstructions } from './codex_mcp_instructions.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';

export const codexSkillSpec = {
	name: 'codex',
	description:
		'Store, search, and revise local beliefs with evidence and revision history. Use when recalling preferences, capturing knowledge, or maintaining agent memory.',
	license: 'MIT',
	compatibility:
		'Release binary needs no runtime installation. npx requires Node.js 24+. MCP stdio or ghostpaw-codex CLI.',
	bin: 'ghostpaw-codex',
	packageName: '@ghostpaw/codex',
	server: 'ghostpaw-codex',
	about: codexMcpInstructions,
	installation: `## Install

Linux/macOS:

\`\`\`sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh | sh
\`\`\`

Installs \`~/.local/bin/ghostpaw-codex\` after checking SHA256SUMS.

Windows x64 (PowerShell):

\`\`\`powershell
irm https://raw.githubusercontent.com/GhostPawJS/codex/main/install.ps1 | iex
\`\`\`

Run tools as \`ghostpaw-codex ...\`; use \`~/.local/bin/ghostpaw-codex\` if it is not on PATH.`,
	tools: codexSurfaceTools,
	workflows: codexSkills,
	principles: codexSoulTraits.map((trait) => trait.principle),
};
