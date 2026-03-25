function toArrayBufferView(value: unknown): Uint8Array | null {
	if (value instanceof Uint8Array) {
		return value;
	}
	if (ArrayBuffer.isView(value)) {
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	}
	if (value instanceof ArrayBuffer) {
		return new Uint8Array(value);
	}
	return null;
}

export function deserializeVectorBlob(value: unknown): Float32Array | null {
	const bytes = toArrayBufferView(value);
	if (bytes === null || bytes.byteLength === 0) {
		return null;
	}
	const aligned = bytes.byteOffset === 0 && bytes.byteLength % 4 === 0 ? bytes : bytes.slice();
	return new Float32Array(aligned.buffer, aligned.byteOffset, aligned.byteLength / 4);
}
