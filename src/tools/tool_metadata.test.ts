import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	arraySchema,
	booleanSchema,
	enumSchema,
	integerSchema,
	numberSchema,
	objectSchema,
	oneOfSchema,
	stringSchema,
} from './tool_metadata.ts';

describe('tool metadata helpers', () => {
	it('builds object schema with required fields', () => {
		const schema = objectSchema({ query: stringSchema('x') }, ['query'], 'Search input.');
		strictEqual(schema.type, 'object');
		strictEqual(schema.required?.[0], 'query');
		strictEqual(schema.description, 'Search input.');
	});

	it('builds typed schemas', () => {
		strictEqual(integerSchema('x').type, 'integer');
		strictEqual(numberSchema('x').type, 'number');
		strictEqual(booleanSchema('x').type, 'boolean');
		strictEqual(stringSchema('x').type, 'string');
	});

	it('builds enum schema', () => {
		const schema = enumSchema(['a', 'b'], 'choices');
		strictEqual(schema.enum?.length, 2);
	});

	it('builds array schema', () => {
		const schema = arraySchema(integerSchema('item'), 'list');
		strictEqual(schema.type, 'array');
		strictEqual(schema.items?.type, 'integer');
	});

	it('builds oneOf schema', () => {
		const schema = oneOfSchema([stringSchema('a'), integerSchema('b')], 'union');
		strictEqual(schema.oneOf?.length, 2);
	});
});
