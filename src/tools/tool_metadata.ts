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
	oneOf?: readonly JsonSchema[] | undefined;
}

export type ToolSideEffects = 'none' | 'writes_state';
export type ToolInputDescriptions = Record<string, string>;
export type ToolOutputDescription = string;

export type ToolEntityKindSet = readonly ('belief' | 'dismissal')[];

export interface CodexToolDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
	name: string;
	description: string;
	whenToUse: string;
	whenNotToUse: string;
	sideEffects: ToolSideEffects;
	readOnly: boolean;
	supportsClarification: boolean;
	targetKinds: ToolEntityKindSet;
	inputDescriptions: ToolInputDescriptions;
	outputDescription: ToolOutputDescription;
	inputSchema: JsonSchema;
	handler: {
		bivarianceHack(db: CodexDb, input: TInput): ToolResult<TOutput>;
	}['bivarianceHack'];
}

// biome-ignore lint/suspicious/noExplicitAny: registry needs to hold heterogeneous tool definitions
export type ToolDefinitionRegistry = readonly CodexToolDefinition<any, any>[];

export function defineCodexTool<TInput, TOutput>(
	tool: CodexToolDefinition<TInput, TOutput>,
): CodexToolDefinition<TInput, TOutput> {
	return tool;
}

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
export function oneOfSchema(schemas: readonly JsonSchema[], description: string): JsonSchema {
	return { oneOf: schemas, description };
}
export function literalSchema(value: string, description: string): JsonSchema {
	return { type: 'string', enum: [value], description };
}
export function nullableStringSchema(description: string): JsonSchema {
	return { type: 'string', description };
}
