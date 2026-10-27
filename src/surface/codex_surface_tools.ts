import type { CodexDb } from '../database.ts';
import type { SurfaceTool } from '../surfaces/surface_types.ts';
import { codexTools } from '../tools/tool_registry.ts';

const mapping: Record<string, NonNullable<SurfaceTool<CodexDb>['cli']>> = {
	search_codex: { verb: 'search', positionals: ['query'] },
	review_codex: { verb: 'review', positionals: ['view'] },
	remember_belief: { noun: 'belief', verb: 'add', positionals: ['claim'] },
	inspect_codex_item: { noun: 'belief', verb: 'show', positionals: ['beliefId'] },
	retire_belief: { noun: 'belief', verb: 'retire', positionals: ['beliefId'] },
	revise_belief: {
		noun: 'belief',
		verb: 'revise',
		positionals: ['beliefId'],
		action: { property: 'action', positionals: { merge: ['beliefIds'] } },
	},
	dismiss_proximity: { noun: 'proximity', verb: 'dismiss', positionals: ['beliefA', 'beliefB'] },
};
export const codexMcpSurfaceTools: readonly SurfaceTool<CodexDb>[] = codexTools.map((tool) => ({
	name: tool.name,
	description: tool.description,
	whenToUse: tool.whenToUse,
	whenNotToUse: tool.whenNotToUse,
	readOnly: tool.readOnly,
	sideEffects: tool.sideEffects,
	inputSchema: { ...tool.inputSchema, type: 'object' },
	handler: tool.handler as SurfaceTool<CodexDb>['handler'],
}));

export const codexSurfaceTools: readonly SurfaceTool<CodexDb>[] =
	/* @__PURE__ */ codexMcpSurfaceTools.map((tool) => ({
		...tool,
		...(mapping[tool.name] ? { cli: mapping[tool.name] } : {}),
	}));
