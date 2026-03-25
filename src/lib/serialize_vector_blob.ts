export function serializeVectorBlob(vector: Float32Array): Uint8Array {
	return new Uint8Array(vector.buffer.slice(0));
}
