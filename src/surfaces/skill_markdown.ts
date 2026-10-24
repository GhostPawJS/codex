import type { SurfaceTool } from './surface_types.ts';

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
	tools: readonly SurfaceTool<TCtx>[];
	workflows: readonly { name: string; description: string }[];
	principles: readonly string[];
}
export function renderSkillMarkdown<TCtx>(
	spec: SkillMarkdownSpec<TCtx>,
	{ referencesBase = 'references' }: { referencesBase?: string } = {},
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
		spec.about,
		'',
		'## Calling tools',
		'',
		`MCP: connect to ${spec.server}, then call a tool by name with its JSON arguments.`,
		'',
		`CLI: \`${spec.bin} call <tool> '<JSON object>'\` or \`${spec.bin} <tool> --parameter value\`${spec.packageName ? ` (without a global install: \`npx -y ${spec.packageName} <tool> ...\`)` : ''}.`,
		'',
		`Inspect schemas with \`${spec.bin} describe <tool>\`. Use \`--db <path>\` to select a database.`,
		'',
	);
	for (const tool of spec.tools) {
		lines.push(
			`## ${tool.name}`,
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
		for (const [name, property] of Object.entries(tool.inputSchema.properties ?? {}))
			lines.push(
				`| ${name} | ${property.type ?? property.oneOf?.map((branch) => branch.type).join(' / ') ?? 'any'} | ${tool.inputSchema.required?.includes(name) ? 'yes' : 'no'} | ${(property.enum ? `${property.enum.join(', ')}. ` : '') + (property.description ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')} |`,
			);
		lines.push('');
	}
	lines.push(
		'## Workflow guides',
		'',
		...spec.workflows.map(
			(workflow) =>
				`- [${workflow.name}](${referencesBase}/${workflow.name}.md): ${workflow.description}`,
		),
		'',
		'## Principles',
		'',
		...spec.principles.map((principle) => `- ${principle}`),
		'',
	);
	return lines.join('\n');
}
