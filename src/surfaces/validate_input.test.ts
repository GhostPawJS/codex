import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateInput } from './validate_input.ts';

test('validates nested types, enum, integer, required, items and inclusive oneOf', () => {
	const schema = {
		type: 'object',
		required: ['rows'],
		properties: {
			rows: { type: 'array', items: { oneOf: [{ type: 'integer' }, { type: 'number' }] } },
			mode: { enum: ['a'] },
		},
	};
	assert.deepEqual(validateInput(schema, { rows: [1, 2.5], extra: true }), []);
	assert.match(validateInput(schema, { rows: [false], mode: 'b' }).join('\n'), /\$\.rows\[0\]/);
	assert.match(validateInput(schema, {}).join('\n'), /\$\.rows: required/);
	assert.ok(validateInput({ type: 'integer' }, 1.5).length);
	assert.deepEqual(validateInput({ type: ['string', 'null'] }, null), []);
});
