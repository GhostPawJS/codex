/** Shared insert columns and placeholders for belief creation. */
export const insertBeliefSql = `INSERT INTO beliefs ( claim, claim_normalized, certainty, evidence, source, category, created_at, verified_at, superseded_by, provenance, deferred_until, embedding, embedding_norm, embedding_dim, embedding_version, topic ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
