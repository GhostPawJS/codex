import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { serializeVectorBlob } from './serialize_vector_blob.ts';

describe('serializeVectorBlob', () => {
	it('serializes float32 vectors into a byte buffer', () => {
		const blob = serializeVectorBlob(new Float32Array([1, 2]));
		strictEqual(blob.byteLength, 8);
	});
});
