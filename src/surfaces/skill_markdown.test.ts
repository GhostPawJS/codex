import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderSkillMarkdown, type SkillMarkdownSpec } from './skill_markdown.ts';

const spec: SkillMarkdownSpec<null> = {
	name: 'example',
	description: 'Manage records. Use when maintaining records.',
	bin: 'example',
	server: 'example',
	about: 'A record engine.',
	tools: [
		{
			name: 'find',
			description: 'Find records',
			whenToUse: 'searching',
			whenNotToUse: 'writing',
			readOnly: true,
			inputSchema: {
				type: 'object',
				required: ['mode'],
				properties: { mode: { type: 'string', enum: ['a', 'b'] } },
			},
			handler: () => null,
		},
	],
	workflows: [{ name: 'search', description: 'Search well' }],
	principles: ['Search first.'],
};
test('skill output has deterministic frontmatter, CLI, MCP and references', () => {
	const result = renderSkillMarkdown({ ...spec, metadata: { version: '1' }, license: 'MIT' });
	assert.equal(
		result,
		renderSkillMarkdown({ ...spec, metadata: { version: '1' }, license: 'MIT' }),
	);
	assert.ok(result.startsWith('---\nname: example\ndescription: '));
	for (const expected of [
		'MCP:',
		'example call <tool>',
		'example skill search',
		'Read-only.',
		'| mode | string | yes | a, b.',
		'Search first.',
	])
		assert.ok(result.includes(expected), expected);
});
test('reject invalid skill metadata', () => {
	for (const name of ['UPPER', '-bad', 'a--b', 'a'.repeat(65)])
		assert.throws(() => renderSkillMarkdown({ ...spec, name }));
	for (const description of ['', 'x'.repeat(1025), 'Missing usage'])
		assert.throws(() => renderSkillMarkdown({ ...spec, description }));
});

test('workflow commands are independent of reference base', () => {
	assert.equal(
		renderSkillMarkdown(spec, { referencesBase: 'skills/example/references' }),
		renderSkillMarkdown(spec),
	);
});

test('tool parameter tables expand nested objects and array element types', () => {
	const tool = spec.tools[0];
	assert.ok(tool);
	const markdown = renderSkillMarkdown({
		...spec,
		tools: [
			{
				...tool,
				inputSchema: {
					type: 'object',
					properties: {
						parent: {
							type: 'object',
							required: ['child'],
							properties: { child: { type: 'array', items: { type: 'integer' } } },
						},
					},
				},
			},
		],
	});
	assert.match(markdown, /\| parent.child \| array of integer \| yes \|/);
});
