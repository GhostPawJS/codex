import { buildQueryEmbedding } from '../lib/build_query_embedding.ts';
import { serializeVectorBlob } from '../lib/serialize_vector_blob.ts';

import { normalizeClaim } from './normalize_claim.ts';

export interface PreparedBeliefStorage {
	claimNormalized: string;
	embedding: Uint8Array;
	embeddingNorm: number;
	embeddingDim: number;
	embeddingVersion: string;
}

export function prepareBeliefStorage(claim: string): PreparedBeliefStorage {
	const embeddingVector = buildQueryEmbedding(claim);
	return {
		claimNormalized: normalizeClaim(claim),
		embedding: serializeVectorBlob(embeddingVector),
		embeddingNorm: 1,
		embeddingDim: embeddingVector.length,
		embeddingVersion: 'local-hash-v1',
	};
}
