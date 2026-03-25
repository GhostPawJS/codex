import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deserializeVectorBlob } from './deserialize_vector_blob.ts';

describe('deserializeVectorBlob', () => {
	it('returns null for empty or unsupported values', () => {
		strictEqual(deserializeVectorBlob(null), null);
		strictEqual(deserializeVectorBlob('x'), null);
	});

	it('deserializes float32 bytes back into a vector', () => {
		const source = new Float32Array([1, 2, 3]);
		const vector = deserializeVectorBlob(new Uint8Array(source.buffer));
		strictEqual(vector?.length, 3);
		strictEqual(vector?.[1], 2);
	});
});
