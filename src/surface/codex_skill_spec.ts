import { codexSkills } from '../skills/skill_registry.ts';
import { codexSoulTraits } from '../soul.ts';
import { codexMcpInstructions } from './codex_mcp_instructions.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';

export const codexSkillSpec = {
	name: 'codex',
	description:
		'Store, search, and revise local beliefs with evidence and revision history. Use when recalling preferences, capturing knowledge, or maintaining agent memory.',
	license: 'MIT',
	compatibility: 'Release binary needs no runtime installation. MCP stdio or ghostpaw-codex CLI.',
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
	cheatSheet: `## Quick reference

Search before adding: \`ghostpaw-codex search "deployment schedule"\`.

- \`ghostpaw-codex belief add "Deploys go out on Tuesdays." --source explicit --category fact\`
- \`ghostpaw-codex belief show <id>\`
- \`ghostpaw-codex belief confirm <id>\`
- \`ghostpaw-codex belief correct <id> --claim "Deploys go out on Wednesdays."\`
- \`ghostpaw-codex belief forget <id>\`
- \`ghostpaw-codex belief defer <id> --deferred-until +7d\`
- \`ghostpaw-codex belief merge <id> <id>\`
- \`ghostpaw-codex review flags|status|log|trends\`
- \`--json\` prints full results; \`--quiet\` prints ids only.
- \`ghostpaw-codex skill --list\` lists guides; \`ghostpaw-codex skill <guide>\` reads one.

Exit codes: 0 success, 1 operation failure, 2 usage, 3 clarification or missing belief, 4 conflict, 70 internal failure.

Database: \`~/.ghostpaw/codex.db\`. Override with \`--db <path>\` or \`GHOSTPAW_CODEX_DB\`.`,
	tools: codexSurfaceTools,
	workflows: codexSkills,
	principles: codexSoulTraits.map((trait) => trait.principle),
};
