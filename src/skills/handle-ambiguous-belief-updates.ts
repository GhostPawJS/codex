import { defineCodexSkill } from './skill_types.ts';

export const handleAmbiguousBeliefUpdatesSkill = defineCodexSkill({
	name: 'handle-ambiguous-belief-updates',
	description:
		'Choose the right verb when new information collides with an existing belief: confirm, correct, merge, forget-with-successor, or dismiss.',
	content: `# Handle Ambiguous Belief Updates

Primary tools:
- \`search_codex\`
- \`inspect_codex_item\`
- \`revise_belief\`
- \`dismiss_proximity\`

Goal:
- Pick the single least-distorted mutation when a new claim overlaps with something already in the Codex.

When to use:
- New information arrives that relates to an existing belief but the right action is not obvious.
- A \`partial_match\` warning appeared during capture.
- Recall returned multiple beliefs on the same topic with different claims.

When not to use:
- The situation is clearly a fresh topic with no existing overlap.
- You already know exactly which verb to use.

Step-by-step sequence:
1. Use \`search_codex\` to find the existing belief that overlaps with the new information.
2. Use \`inspect_codex_item\` on the existing belief to understand its full context: certainty, evidence, source, lineage, proximity.
3. Apply the decision tree:
   - **Unchanged meaning**: use \`revise_belief\` with \`action: "confirm"\` to reinforce the existing belief.
   - **Replacement**: use \`revise_belief\` with \`action: "correct"\` providing the updated claim.
   - **Overlapping details**: use \`revise_belief\` with \`action: "merge"\` to consolidate both into a richer successor.
   - **Outdated old belief**: use \`revise_belief\` with \`action: "forget"\` and \`successorId\` pointing to the better active belief.
   - **Genuinely unrelated**: use \`dismiss_proximity\` if the overlap is only topical, not semantic.
4. After acting, verify the result matches the intended outcome.

Validation checks:
- Only one active belief remains for each distinct proposition.
- The chosen verb preserved lineage honestly.
- No genuine duplicates were left unresolved.

Pitfalls:
- Do not default to creating a new belief when an existing one should be revised.
- Do not choose forget without a successor when a clear winner exists.
- Do not guess between merge and correct; inspect both claims carefully.
- Do not merge beliefs that are about different things.

Tips and tricks:
- When in doubt between confirm and correct, ask: did the *claim* change, or just the confidence?
- When in doubt between merge and forget-with-successor, ask: does the losing belief add unique information?
- The decision tree is not about the new information alone — it depends on the existing belief's state too.

Tool calls to prefer:
- \`search_codex\` for finding the overlap
- \`inspect_codex_item\` for full context
- \`revise_belief\` with the appropriate action
- \`dismiss_proximity\` for false overlaps

Related skills:
- \`resolve-near-duplicate-beliefs\`
- \`correct-belief-lineage-honestly\`
- \`direct-supersession-between-beliefs\``,
});
