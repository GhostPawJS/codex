import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { codexSkills } from '../skills/skill_registry.ts';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { validateInput } from '../surfaces/validate_input.ts';
import { codexSkillSpec } from './codex_skill_spec.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';
import { renderCodexSkillCommand } from './render_codex_skill_command.ts';

test('CLI guide content is byte-identical to every generated reference', () => {
	for (const guide of codexSkills) {
		assert.equal(
			renderCodexSkillCommand([guide.name]),
			readFileSync(
				new URL(`../../skills/codex/references/${guide.name}.md`, import.meta.url),
				'utf8',
			),
		);
		assert.ok(
			renderCodexSkillCommand(['--list']).includes(`${guide.name}  ${guide.description}\n`),
		);
	}
	assert.match(renderCodexSkillCommand(['--help']), /skill <guide>/);
	assert.throws(
		() => renderCodexSkillCommand(['capture-beliefs-wel']),
		/did you mean capture-beliefs-well\?.*skill --list/,
	);
});

test('every rendered tool example validates and occurs exactly once', () => {
	const markdown = renderSkillMarkdown(codexSkillSpec);
	for (const tool of codexSurfaceTools) {
		const examples = [
			...markdown.matchAll(
				new RegExp(`Example: \`ghostpaw-codex call ${tool.name} '(.*?)'\``, 'g'),
			),
		];
		assert.equal(examples.length, 1, tool.name);
		assert.deepEqual(
			validateInput(tool.inputSchema, JSON.parse(examples[0]?.[1] ?? 'null')),
			[],
			tool.name,
		);
	}
	assert.ok(!/npx|Node\.js 24/.test(markdown.split('## Without the binary')[0] ?? ''));
});
