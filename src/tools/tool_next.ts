import {
	dismissProximityToolName,
	inspectCodexItemToolName,
	reviewCodexToolName,
	reviseBeliefToolName,
	searchCodexToolName,
} from './tool_names.ts';
import type { ToolNextStepHint } from './tool_types.ts';

export function inspectItemNext(beliefId: number, claim?: string): ToolNextStepHint {
	return {
		kind: 'inspect_item',
		message: claim ? `Inspect belief "${claim}".` : `Inspect belief ${beliefId}.`,
		tool: inspectCodexItemToolName,
		suggestedInput: { beliefId },
	};
}

export function useToolNext(
	tool: string,
	message: string,
	suggestedInput?: Record<string, unknown>,
): ToolNextStepHint {
	return { kind: 'use_tool', message, tool, suggestedInput };
}

export function reviewViewNext(
	view: 'flags' | 'status' | 'log' | 'trends',
	message: string,
): ToolNextStepHint {
	return {
		kind: 'review_view',
		message,
		tool: reviewCodexToolName,
		suggestedInput: { view },
	};
}

export function retryNext(
	message: string,
	suggestedInput?: Record<string, unknown>,
): ToolNextStepHint {
	return { kind: 'retry_with', message, suggestedInput };
}

export function searchNext(query: string, message: string): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message,
		tool: searchCodexToolName,
		suggestedInput: { query },
	};
}

export function dismissNext(beliefA: number, beliefB: number): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message: 'Dismiss this proximity pair if the beliefs are unrelated.',
		tool: dismissProximityToolName,
		suggestedInput: { beliefA, beliefB },
	};
}

export function reviseNext(action: string, beliefId: number, message: string): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message,
		tool: reviseBeliefToolName,
		suggestedInput: { action, beliefId },
	};
}
