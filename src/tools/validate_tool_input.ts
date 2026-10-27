import { validateInput } from '../surfaces/validate_input.ts';
import type { JsonSchema } from './tool_metadata.ts';
import { type ToolFailure, toolFailure } from './tool_types.ts';

export function validateToolInput(schema: JsonSchema, input: unknown): ToolFailure | undefined {
	const errors = validateInput(schema, input);
	if (input && typeof input === 'object') {
		for (const [name, value] of Object.entries(input)) {
			if (typeof value === 'string' && !value.trim()) errors.push(`${name}: must not be empty`);
		}
	}
	if (!errors.length) return;
	const message = errors.join('; ');
	const result = toolFailure('protocol', 'invalid_input', 'Invalid tool input.', message);
	const example: Record<string, unknown> = {};
	for (const [name, property] of Object.entries(schema.properties ?? {})) {
		if (
			!schema.required?.includes(name) &&
			name !== 'beliefId' &&
			!(input && typeof input === 'object' && Object.hasOwn(input, name))
		)
			continue;
		example[name] =
			property.enum?.[0] ??
			(property.type === 'integer' || property.type === 'number'
				? 1
				: property.type === 'array'
					? [1, 2]
					: name === 'query'
						? 'deployment schedule'
						: name === 'claim'
							? 'Deploys go out on Tuesdays.'
							: 'example');
	}
	result.error.recovery = `Check ${message}. Valid input example: ${JSON.stringify(example)}. For action-specific fields, inspect the tool schema.`;
	return result;
}
