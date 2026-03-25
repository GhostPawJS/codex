import { defineCodexSkill } from './skill_types.ts';

export const searchAndRetrieveBeliefsSkill = defineCodexSkill({
	name: 'search-and-retrieve-beliefs',
	description:
		'Find relevant beliefs by natural-language query, then inspect exact candidates in detail without scanning the whole codex.',
	content: `# Search And Retrieve Beliefs

Primary tools:
- \`search_codex\`
- \`inspect_codex_item\`
- \`review_codex\`

Goal:
- Retrieve current beliefs about a topic efficiently, using ranked recall instead of loading everything.

When to use:
- You need to know what the Codex already holds about a topic before acting.
- You want to check whether a belief already exists before creating a new one.
- A user or agent asks a question that stored beliefs might answer.

When not to use:
- You already have a specific belief id and just need its detail — go straight to \`inspect_codex_item\`.
- You need a structured maintenance surface — use \`review_codex\` instead.

Step-by-step sequence:
1. Use \`search_codex\` with a descriptive natural-language query. Add \`category\` or \`source\` filters when you know the belief type.
2. If the result contains an \`empty_result\` warning, the Codex has nothing on this topic. Consider whether to capture a new belief or try a broader query.
3. For each top candidate, read the recall score, certainty, evidence count, and strength tier to judge trustworthiness.
4. Use \`inspect_codex_item\` on the highest-ranked result when you need full detail: lineage, proximity, version diff.
5. Only drill into lineage or proximity when the detail reveals supersession history or nearby conflicts that affect the decision.
6. If the search results feel incomplete, use \`review_codex\` with \`view: "status"\` to see how large the codex is and whether the query topic is underrepresented.

Validation checks:
- The recall results include beliefs you expected to find.
- High-confidence well-confirmed beliefs rank above single-evidence inferred ones.
- Inspected detail matches what the recall score suggested about the belief's reliability.

Pitfalls:
- Do not rely on search alone when the codex is empty or very small — check status first.
- Do not skip inspection when a recalled belief is about to drive an important decision.
- Do not assume recall results are exhaustive; the scoring threshold filters weak matches.

Tips and tricks:
- Use \`minScore: 0\` during exploration to see everything, then tighten the threshold for production queries.
- Category-filtered search is powerful for use cases like retrieving all active preferences or procedures.
- The \`next\` hints in the search result suggest which beliefs to inspect first.

Tool calls to prefer:
- \`search_codex\` for discovery
- \`inspect_codex_item\` for exact detail
- \`review_codex\` with \`status\` when context about overall codex size is needed

Related skills:
- \`capture-beliefs-well\`
- \`handle-ambiguous-belief-updates\``,
});
