import { defineCodexSkill } from './skill_types.ts';

export const batchIngestWithDeduplicationSkill = defineCodexSkill({
	name: 'batch-ingest-with-deduplication',
	description:
		'High-volume capture that avoids creating duplicates by searching before each remember and resolving overlaps immediately.',
	content: `# Batch Ingest With Deduplication

Primary tools:
- \`search_codex\`
- \`remember_belief\`
- \`revise_belief\`
- \`dismiss_proximity\`

Goal:
- Ingest a batch of candidate beliefs efficiently while preventing duplicates and contradictions from entering the codex.

When to use:
- Importing beliefs from an external source (meeting notes, research, knowledge base migration).
- Multiple beliefs need to be captured in a single session.
- The risk of overlapping with existing beliefs is high.

When not to use:
- Capturing a single well-understood belief — use \`capture-beliefs-well\` directly.
- The batch is small enough (1-2 beliefs) to handle manually.

Step-by-step sequence:
1. For each candidate belief in the batch:
   a. Use \`search_codex\` with the candidate claim as the query.
   b. If a strong match exists: use \`revise_belief\` with \`action: "confirm"\` (same meaning) or \`action: "correct"\` (updated meaning).
   c. If no match exists: use \`remember_belief\` with the claim, source, and category.
2. After each \`remember_belief\`, check for \`partial_match\` warnings in the response.
3. If a partial match is a genuine overlap: use \`revise_belief\` with \`action: "merge"\` or \`action: "forget"\` with successor.
4. If a partial match is a false positive: use \`dismiss_proximity\` to suppress the pair.
5. After processing the full batch, use \`review_codex\` with \`view: "status"\` to verify belief counts and integrity.

Validation checks:
- No two active beliefs hold the same proposition.
- \`partial_match\` warnings were all addressed (either merged, superseded, or dismissed).
- Integrity has not dropped during the batch (contradictions caught inline).
- All candidates were processed — none silently dropped.

Pitfalls:
- Do not skip the search step for speed — duplicates are much more expensive to resolve later.
- Do not ignore partial match warnings during ingestion — they compound rapidly.
- Do not create all beliefs first and resolve duplicates later; handle them inline.

Tips and tricks:
- Sort the batch by topic or category before ingesting so that overlaps surface adjacently.
- Use \`skipProximity: true\` in the remember options if you plan to do a single proximity pass after the full batch.
- After ingestion, a single \`review_codex\` with \`flags\` will show any proximity pairs that still need resolution.

Tool calls to prefer:
- \`search_codex\` before every capture
- \`remember_belief\` for new entries
- \`revise_belief\` with \`confirm\` or \`correct\` for existing matches
- \`dismiss_proximity\` for false positives

Related skills:
- \`capture-beliefs-well\`
- \`resolve-near-duplicate-beliefs\``,
});
