import { codexSkills } from '../skills/skill_registry.ts';
import { CliUsageError } from '../surfaces/cli_args.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { codexSkillSpec } from './codex_skill_spec.ts';
import { renderWorkflowGuide } from './render_workflow_guide.ts';

export function renderCodexSkillCommand(args: string[]): string {
	if (!args.length) return renderSkillMarkdown(codexSkillSpec);
	if (args.length === 1 && ['--help', '-h'].includes(args[0] ?? ''))
		return 'Usage: ghostpaw-codex skill\n       ghostpaw-codex skill --list\n       ghostpaw-codex skill <guide>\n';
	if (args.length === 1 && args[0] === '--list')
		return `${codexSkills.map((guide) => `${guide.name}  ${guide.description}`).join('\n')}\n`;
	const guide = codexSkills.find((guide) => guide.name === args[0]);
	if (guide && args.length === 1) return renderWorkflowGuide(guide);
	const name = args[0] ?? '';
	const distance = (candidate: string) => {
		let row = Array.from({ length: name.length + 1 }, (_, i) => i);
		for (const [i, char] of [...candidate].entries()) {
			const next = [i + 1];
			for (let j = 0; j < name.length; j++)
				next.push(
					Math.min(
						(next[j] ?? 0) + 1,
						(row[j + 1] ?? 0) + 1,
						(row[j] ?? 0) + (char === name[j] ? 0 : 1),
					),
				);
			row = next;
		}
		return row[name.length] ?? 0;
	};
	const closest = [...codexSkills].sort((a, b) => distance(a.name) - distance(b.name))[0];
	throw new CliUsageError(
		`Unknown guide: ${name}; did you mean ${closest?.name}? See ghostpaw-codex skill --list.`,
	);
}
