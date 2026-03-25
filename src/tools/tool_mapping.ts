import {
	dismissProximityToolName,
	inspectCodexItemToolName,
	rememberBeliefToolName,
	retireBeliefToolName,
	reviewCodexToolName,
	reviseBeliefToolName,
	searchCodexToolName,
} from './tool_names.ts';

export interface CodexToolMapping {
	source: string;
	tool: string;
	action?: string | undefined;
	view?: string | undefined;
}

export const codexToolMappings: readonly CodexToolMapping[] = [
	{ source: 'recall', tool: searchCodexToolName },
	{ source: 'listFlags', tool: reviewCodexToolName, view: 'flags' },
	{ source: 'getStatus', tool: reviewCodexToolName, view: 'status' },
	{ source: 'listLog', tool: reviewCodexToolName, view: 'log' },
	{ source: 'getTrends', tool: reviewCodexToolName, view: 'trends' },
	{ source: 'getBeliefDetail', tool: inspectCodexItemToolName },
	{ source: 'getBeliefLineage', tool: inspectCodexItemToolName },
	{ source: 'listBeliefProximity', tool: inspectCodexItemToolName },
	{ source: 'remember', tool: rememberBeliefToolName },
	{ source: 'confirmBelief', tool: reviseBeliefToolName, action: 'confirm' },
	{ source: 'correctBelief', tool: reviseBeliefToolName, action: 'correct' },
	{ source: 'mergeBeliefs', tool: reviseBeliefToolName, action: 'merge' },
	{ source: 'forgetBelief', tool: reviseBeliefToolName, action: 'forget' },
	{ source: 'deferBelief', tool: reviseBeliefToolName, action: 'defer' },
	{ source: 'deleteBelief', tool: retireBeliefToolName },
	{ source: 'dismissProximityPair', tool: dismissProximityToolName },
];
