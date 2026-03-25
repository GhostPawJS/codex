import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { objectSchema, stringSchema } from './tool_metadata.ts';

describe('tool metadata helpers', () => {
	it('builds lightweight JSON schema objects', () => {
		const schema = objectSchema({ query: stringSchema('x') }, ['query']);
		strictEqual(schema.type, 'object');
		strictEqual(schema.required?.[0], 'query');
	});
});
