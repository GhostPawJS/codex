import type { JsonSchema, SurfaceTool } from './surface_types.ts';

export interface SkillMarkdownSpec<TCtx> {
	name: string;
	description: string;
	license?: string;
	compatibility?: string;
	metadata?: Record<string, string>;
	bin: string;
	packageName?: string;
	server: string;
	about: string;
	installation?: string;
	cheatSheet?: string;
	tools: readonly SurfaceTool<TCtx>[];
	workflows: readonly { name: string; description: string }[];
	principles: readonly string[];
}
export function renderSkillMarkdown<TCtx>(
	spec: SkillMarkdownSpec<TCtx>,
	{ referencesBase: _referencesBase = 'references' }: { referencesBase?: string } = {},
): string {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.name) || spec.name.length > 64)
		throw new Error('Invalid skill name');
	if (
		!spec.description.trim() ||
		spec.description.length > 1024 ||
		!spec.description.includes('Use when')
	)
		throw new Error('Invalid skill description');
	if (spec.compatibility && spec.compatibility.length > 500)
		throw new Error('Invalid compatibility');
	const lines = ['---', `name: ${spec.name}`, `description: ${JSON.stringify(spec.description)}`];
	for (const key of ['license', 'compatibility'] as const)
		if (spec[key]) lines.push(`${key}: ${JSON.stringify(spec[key])}`);
	if (spec.metadata) {
		lines.push('metadata:');
		for (const key of Object.keys(spec.metadata).sort())
			lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(spec.metadata[key])}`);
	}
	lines.push(
		'---',
		'',
		`# ${spec.name}`,
		'',
		...(spec.installation ? [spec.installation, ''] : []),
		...(spec.cheatSheet ? [spec.cheatSheet, ''] : []),
		spec.about,
		'',
		'## Calling tools',
		'',
		`MCP: connect to ${spec.server}, then call a tool by name with its JSON arguments.`,
		'',
		`CLI: \`${spec.bin} call <tool> '<JSON object>'\` or \`${spec.bin} <tool> --parameter value\`.`,
		'',
		`Inspect schemas with \`${spec.bin} describe <tool>\`. Use \`--db <path>\` to select a database.`,
		'',
	);
	for (const tool of spec.tools) {
		lines.push(
			`## ${tool.name}${tool.cli ? ` (CLI: ${spec.bin} ${[tool.cli.noun, tool.cli.action ? tool.inputSchema.properties?.[tool.cli.action.property]?.enum?.[0] : tool.cli.verb].filter(Boolean).join(' ')})` : ''}`,
			'',
			tool.description,
			'',
			`Use when: ${tool.whenToUse ?? ''}`,
			'',
			`Not for: ${tool.whenNotToUse ?? ''}`,
			'',
			tool.readOnly ? 'Read-only.' : `Writes: ${tool.sideEffects ?? 'state'}.`,
			'',
			'| Parameter | Type | Required | Values / description |',
			'| --- | --- | --- | --- |',
		);
		const typeName = (schema: JsonSchema): string =>
			schema.type === 'array'
				? `array of ${typeName(schema.items ?? {})}`
				: String(schema.type ?? schema.oneOf?.map(typeName).join(' / ') ?? 'any');
		const rows = (schema: JsonSchema, prefix = '') => {
			for (const [name, property] of Object.entries(schema.properties ?? {})) {
				const path = prefix ? `${prefix}.${name}` : name;
				lines.push(
					`| ${path} | ${typeName(property)} | ${schema.required?.includes(name) ? 'yes' : 'no'} | ${(property.enum ? `${property.enum.join(', ')}. ` : '') + (property.description ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')} |`,
				);
				if (property.properties) rows(property, path);
			}
		};
		rows(tool.inputSchema);
		if (tool.example)
			lines.push(
				'',
				`Example: \`${spec.bin} call ${tool.name} '${JSON.stringify(tool.example)}'\``,
			);
		lines.push('');
	}
	lines.push(
		'## Workflow guides',
		'',
		...spec.workflows.map(
			(workflow) => `- \`${spec.bin} skill ${workflow.name}\`: ${workflow.description}`,
		),
		'',
		'## Principles',
		'',
		...spec.principles.map((principle) => `- ${principle}`),
		'',
	);
	if (spec.packageName)
		lines.push(
			'## Without the binary',
			'',
			`For npm-based environments (Node 24+), run tools with \`npx -y ${spec.packageName} ...\`.`,
			'',
			`Harnesses embedding it in code can import \`${spec.packageName}\` as a library.`,
			'',
		);
	return lines.join('\n');
}
