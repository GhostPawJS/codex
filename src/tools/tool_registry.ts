import { dismissProximityTool } from './dismiss_proximity_tool.ts';
import { inspectCodexItemTool } from './inspect_codex_item_tool.ts';
import { rememberBeliefTool } from './remember_belief_tool.ts';
import { retireBeliefTool } from './retire_belief_tool.ts';
import { reviewCodexTool } from './review_codex_tool.ts';
import { reviseBeliefTool } from './revise_belief_tool.ts';
import { searchCodexTool } from './search_codex_tool.ts';
import type { ToolDefinitionRegistry } from './tool_metadata.ts';

export const codexTools = [
	searchCodexTool,
	reviewCodexTool,
	inspectCodexItemTool,
	rememberBeliefTool,
	reviseBeliefTool,
	retireBeliefTool,
	dismissProximityTool,
] satisfies ToolDefinitionRegistry;

export function listCodexToolDefinitions() {
	return [...codexTools];
}

export function getCodexToolByName(name: string) {
	return codexTools.find((tool) => tool.name === name) ?? null;
}
