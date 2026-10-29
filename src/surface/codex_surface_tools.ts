import type { CodexDb } from '../database.ts';
import type { SurfaceTool } from '../surfaces/surface_types.ts';
import { codexTools } from '../tools/tool_registry.ts';
import { parseDeferralDate } from './parse_deferral_date.ts';
import { parseReviewDate } from './parse_review_date.ts';

const mapping: Record<string, NonNullable<SurfaceTool<CodexDb>['cli']>> = {
	search_codex: { verb: 'search', positionals: ['query'] },
	review_codex: { verb: 'review', positionals: ['view'], valueParsers: { now: parseReviewDate } },
	remember_belief: { noun: 'belief', verb: 'add', positionals: ['claim'] },
	inspect_codex_item: { noun: 'belief', verb: 'show', positionals: ['beliefId'] },
	retire_belief: { noun: 'belief', verb: 'retire', positionals: ['beliefId'] },
	revise_belief: {
		noun: 'belief',
		verb: 'revise',
		positionals: ['beliefId'],
		valueParsers: { deferredUntil: parseDeferralDate },
		action: {
			property: 'action',
			positionals: { merge: ['beliefIds'] },
			flags: {
				confirm: ['beliefId', 'provenance'],
				correct: ['beliefId', 'claim', 'source', 'category', 'certainty', 'provenance'],
				forget: ['beliefId', 'successorId', 'provenance'],
				defer: ['beliefId', 'deferredUntil', 'provenance'],
				merge: [
					'beliefIds',
					'claim',
					'successorId',
					'source',
					'category',
					'certainty',
					'provenance',
				],
			},
		},
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

const examples: Record<string, Record<string, unknown>> = {
	search_codex: { query: 'deployment schedule' },
	review_codex: { view: 'flags' },
	inspect_codex_item: { beliefId: 1 },
	remember_belief: {
		claim: 'Deploys go out on Tuesdays.',
		source: 'explicit',
		category: 'procedure',
	},
	revise_belief: { action: 'confirm', beliefId: 1 },
	retire_belief: { beliefId: 1 },
	dismiss_proximity: { beliefA: 1, beliefB: 2 },
};

export const codexSurfaceTools: readonly SurfaceTool<CodexDb>[] =
	/* @__PURE__ */ codexMcpSurfaceTools.map((tool) => ({
		...tool,
		example: examples[tool.name],
		...(mapping[tool.name] ? { cli: mapping[tool.name] } : {}),
	}));
