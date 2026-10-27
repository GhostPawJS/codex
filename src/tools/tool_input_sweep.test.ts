import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import type { JsonSchema } from './tool_metadata.ts';
import { codexTools } from './tool_registry.ts';

test('all tool handlers handle missing, partial and malformed input without system errors', async () => {
	const sample = (schema: JsonSchema): unknown =>
		schema.enum?.[0] ??
		(schema.type === 'object'
			? Object.fromEntries(
					Object.entries(schema.properties ?? {})
						.filter(([key]) => schema.required?.includes(key))
						.map(([key, value]) => [key, sample(value)]),
				)
			: schema.type === 'array'
				? [sample(schema.items ?? {})]
				: schema.type === 'integer' || schema.type === 'number'
					? 1
					: 'example');
	for (const tool of codexTools) {
		const base = sample(tool.inputSchema) as Record<string, unknown>;
		const cases: unknown[] = [
			{},
			null,
			undefined,
			'',
			1,
			[],
			...Object.keys(base).map((key) =>
				Object.fromEntries(Object.entries(base).filter(([name]) => key !== name)),
			),
		];
		for (const [key, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
			for (const bad of [null, undefined, '', schema.type === 'string' ? 123 : 'wrong', {}, []])
				cases.push({ ...base, [key]: bad });
			if (schema.enum) cases.push({ ...base, [key]: 'unknown_enum_value' });
		}
		for (const action of tool.inputSchema.properties?.action?.enum ?? []) {
			cases.push({ action });
			for (const [key, schema] of Object.entries(tool.inputSchema.properties ?? {})) {
				if (key !== 'action') {
					cases.push({ action, [key]: sample(schema) });
					for (const bad of [null, undefined, '', schema.type === 'string' ? 123 : 'wrong', {}, []])
						cases.push({ action, [key]: bad });
				}
			}
		}
		for (const input of cases) {
			const db = await createInitializedCodexDb();
			try {
				const result = (
					tool.handler as (context: typeof db, input: unknown) => ReturnType<typeof tool.handler>
				)(db, input);
				assert.ok(result, `${tool.name}: ${JSON.stringify(input)}`);
				if (result.outcome === 'error') {
					assert.notEqual(
						result.error.code,
						'system_error',
						`${tool.name}: ${JSON.stringify(input)}: ${result.error.message}`,
					);
					assert.ok(result.error.recovery?.trim(), `${tool.name}: missing recovery`);
				} else if (result.outcome === 'needs_clarification')
					assert.ok(result.clarification.question.trim());
			} finally {
				db.close();
			}
		}
	}
});
