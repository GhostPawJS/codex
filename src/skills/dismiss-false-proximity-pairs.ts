import { defineCodexSkill } from './skill_types.ts';

export const dismissFalseProximityPairsSkill = defineCodexSkill({
	name: 'dismiss-false-proximity-pairs',
	description:
		'Suppress proximity pairs that are topically near but genuinely distinct, using exponential backoff to handle recurrence.',
	content: `# Dismiss False Proximity Pairs

Primary tools:
- \`inspect_codex_item\`
- \`dismiss_proximity\`

Goal:
- Clean up false positive proximity alerts so they do not clutter the maintenance queue, while allowing them to resurface if one belief changes.

When to use:
- Proximity flagged two beliefs that are about different things despite textual or semantic similarity.
- The pair has already been evaluated and confirmed as genuinely distinct.
- Proximity alerts for the same pair keep recurring in flags.

When not to use:
- The pair might actually be duplicates — use \`resolve-near-duplicate-beliefs\` instead.
- One belief should supersede the other — use \`direct-supersession-between-beliefs\`.

Step-by-step sequence:
1. Use \`inspect_codex_item\` on one of the flagged beliefs to see its proximity matches.
2. Verify that the proximity pair is genuinely unrelated by comparing the claims semantically.
3. Use \`dismiss_proximity\` with both belief ids to suppress the pair.
4. Note that the dismissal uses exponential backoff — repeated dismissals of the same pair extend the suppression window.
5. If the pair resurfaces after the backoff expires and the beliefs are still genuinely distinct, dismiss again.

Validation checks:
- The dismissed pair no longer appears in the proximity list for either belief.
- The dismissal was recorded (not silently dropped).
- If the pair was dismissed before, the backoff window is longer this time.

Pitfalls:
- Do not dismiss pairs that are genuine duplicates — that hides real overlap.
- Do not dismiss without inspecting both beliefs first.
- Do not expect dismissals to be permanent — they expire on purpose so that changed beliefs get re-evaluated.

Tips and tricks:
- Exponential backoff means frequently dismissed pairs become less noisy over time without permanent suppression.
- Dismissals are cheap — when in doubt between "genuinely distinct" and "might overlap", err on the side of dismissing and letting it resurface later.
- Bulk dismissal after batch ingestion is common; process all proximity flags in one pass.

Tool calls to prefer:
- \`inspect_codex_item\` for claim comparison
- \`dismiss_proximity\` for the suppression

Related skills:
- \`resolve-near-duplicate-beliefs\`
- \`review-flags-batch\``,
});
