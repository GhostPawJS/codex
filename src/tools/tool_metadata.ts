import type { CodexDb } from '../database.ts';

import type { ToolResult } from './tool_types.ts';

export type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';

export interface JsonSchema {
	type?: JsonSchemaType | undefined;
	description?: string | undefined;
	properties?: Record<string, JsonSchema> | undefined;
	required?: string[] | undefined;
	items?: JsonSchema | undefined;
	enum?: readonly (string | number | boolean)[] | undefined;
}

export type ToolSideEffects = 'none' | 'read' | 'write';

export interface CodexToolDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
	name: string;
	description: string;
	inputSchema: JsonSchema;
	outputDescription: string;
	sideEffects: ToolSideEffects;
	handler: {
		bivarianceHack(db: CodexDb, input: TInput): ToolResult<TOutput>;
	}['bivarianceHack'];
}

export type ToolDefinitionRegistry = readonly CodexToolDefinition[];

export function stringSchema(description: string): JsonSchema {
	return { type: 'string', description };
}
export function numberSchema(description: string): JsonSchema {
	return { type: 'number', description };
}
export function integerSchema(description: string): JsonSchema {
	return { type: 'integer', description };
}
export function booleanSchema(description: string): JsonSchema {
	return { type: 'boolean', description };
}
export function arraySchema(items: JsonSchema, description: string): JsonSchema {
	return { type: 'array', items, description };
}
export function objectSchema(
	properties: Record<string, JsonSchema>,
	required: string[] = [],
	description?: string,
): JsonSchema {
	return { type: 'object', properties, required, description };
}
export function enumSchema(values: readonly string[], description: string): JsonSchema {
	return { type: 'string', enum: values, description };
}
export function defineCodexTool<TInput, TOutput>(
	tool: CodexToolDefinition<TInput, TOutput>,
): CodexToolDefinition<TInput, TOutput> {
	return tool;
}
