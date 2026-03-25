import { defineCodexSkill } from './skill_types.ts';

export const captureBeliefsWellSkill = defineCodexSkill({
	name: 'capture-beliefs-well',
	description:
		'Capture one belief per claim with correct source, category, and certainty, always searching first to avoid duplicates.',
	content: `# Capture Beliefs Well

Primary tools:
- \`search_codex\`
- \`remember_belief\`
- \`revise_belief\`

Goal:
- Add new beliefs that are atomic, correctly classified, and not duplicates of existing knowledge.

When to use:
- New information arrives that should be stored in the Codex.
- A user states a preference, a fact is observed, a procedure is distilled, or a conclusion is inferred.

When not to use:
- The information reinforces something already held — use \`revise_belief\` with \`confirm\` instead.
- The information corrects something already held — use \`revise_belief\` with \`correct\` instead.

Step-by-step sequence:
1. Split compound claims into separate atomic propositions. Each belief should carry one testable assertion.
2. Choose the strongest honest source: \`explicit\` if stated, \`observed\` if seen, \`distilled\` if extracted, \`inferred\` if concluded.
3. Choose the narrowest fitting category: \`preference\`, \`fact\`, \`procedure\`, \`capability\`, or \`custom\`.
4. Use \`search_codex\` with the candidate claim as the query to check for existing beliefs on the same topic.
5. If a strong match exists: use \`revise_belief\` with \`confirm\` (same meaning) or \`correct\` (updated meaning) instead of creating a duplicate.
6. If no match exists: use \`remember_belief\` with the claim, source, and category.
7. Check the \`partial_match\` warning in the response. If nearby beliefs are flagged, inspect them before proceeding.
8. If the proximity match is a genuine near-duplicate, consider merging or dismissing the pair immediately.

Validation checks:
- The newly created belief appears in search results for its topic.
- No \`partial_match\` warning was ignored without inspection.
- The source and category match the real evidence quality and claim type.

Pitfalls:
- Do not combine multiple propositions into one belief claim.
- Do not use \`explicit\` as a default when the real source is \`inferred\` or \`distilled\`.
- Do not skip the search step — duplicates degrade integrity and waste maintenance effort.
- Do not ignore proximity warnings; they exist to catch overlaps at creation time.

Tips and tricks:
- Use \`provenance\` to record where the information came from (session id, URL, meeting name).
- Only override \`certainty\` when you have a specific reason; source-weighted defaults are usually correct.
- After capturing, the \`next\` hints in the result guide you to inspect the new belief or search for overlap.

Tool calls to prefer:
- \`search_codex\` before capture
- \`remember_belief\` for the actual creation
- \`revise_belief\` with \`confirm\` or \`correct\` when an existing belief already covers the topic

Related skills:
- \`search-and-retrieve-beliefs\`
- \`resolve-near-duplicate-beliefs\`
- \`batch-ingest-with-deduplication\``,
});
