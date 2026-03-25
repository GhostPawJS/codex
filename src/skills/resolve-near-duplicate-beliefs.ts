import { defineCodexSkill } from './skill_types.ts';

export const resolveNearDuplicateBeliefsSkill = defineCodexSkill({
	name: 'resolve-near-duplicate-beliefs',
	description:
		'Decide whether two proximate beliefs are duplicates, successors, complementary, or genuinely distinct, then act accordingly.',
	content: `# Resolve Near Duplicate Beliefs

Primary tools:
- \`inspect_codex_item\`
- \`revise_belief\`
- \`dismiss_proximity\`

Goal:
- Resolve every proximity pair into one of four outcomes: supersede, correct, merge, or dismiss.

When to use:
- A \`partial_match\` warning appeared after \`remember_belief\`.
- \`inspect_codex_item\` shows proximity matches for a belief.
- Two beliefs keep surfacing together in recall results for the same query.

When not to use:
- The two beliefs are about clearly different topics and proximity has not flagged them.
- You are resolving a flag for reasons other than overlap.

Step-by-step sequence:
1. Use \`inspect_codex_item\` on the first belief to see its full detail and proximity list.
2. Use \`inspect_codex_item\` on the second belief to compare claims, certainty, evidence, and source.
3. Decide which case applies:
   - **Identical meaning**: use \`revise_belief\` with \`action: "forget"\` on the weaker one, setting \`successorId\` to the stronger one.
   - **One replaces the other**: use \`revise_belief\` with \`action: "correct"\` on the older one, providing the updated claim.
   - **Complementary details**: use \`revise_belief\` with \`action: "merge"\` passing both ids and a combined claim.
   - **Genuinely distinct**: use \`dismiss_proximity\` to suppress the pair with exponential backoff.
4. After the action, verify the result: check that supersession landed correctly or that the dismissal was recorded.

Validation checks:
- Only one active belief remains for the same proposition (for duplicate/replacement cases).
- The merged belief captures the essential information from both sources.
- Dismissed pairs no longer appear in proximity results until the backoff expires.

Pitfalls:
- Do not merge beliefs that are about different things just because they are topically near.
- Do not forget a belief without setting \`successorId\` when a clear winner exists.
- Do not dismiss a pair that is a genuine conflict or duplication.
- Do not skip inspection of both beliefs before deciding.

Tips and tricks:
- The belief with higher evidence and certainty is usually the better survivor.
- If both beliefs add unique value, merge is better than choosing one arbitrarily.
- Dismiss is cheap — false positives in proximity cost one call with exponential backoff.

Tool calls to prefer:
- \`inspect_codex_item\` on both beliefs
- \`revise_belief\` with \`forget\`, \`correct\`, or \`merge\` depending on the case
- \`dismiss_proximity\` for genuinely distinct pairs

Related skills:
- \`capture-beliefs-well\`
- \`dismiss-false-proximity-pairs\`
- \`direct-supersession-between-beliefs\``,
});
