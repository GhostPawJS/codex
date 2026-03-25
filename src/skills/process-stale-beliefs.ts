import { defineCodexSkill } from './skill_types.ts';

export const processStaleBeliefsSkill = defineCodexSkill({
	name: 'process-stale-beliefs',
	description:
		'Refresh or retire beliefs whose freshness has dropped too far, using flags to identify them and the right verb to resolve each.',
	content: `# Process Stale Beliefs

Primary tools:
- \`review_codex\`
- \`inspect_codex_item\`
- \`revise_belief\`

Goal:
- Prevent beliefs from silently rotting by processing stale and fading flags before integrity degrades further.

When to use:
- Flags show beliefs with \`stale\` or \`fading\` reason codes.
- Integrity has been declining because unconfirmed beliefs are accumulating.
- A periodic freshness pass is due.

When not to use:
- The belief is flagged for reasons other than staleness (use the general \`review-flags-batch\` skill).
- You are looking for a specific belief — use search instead.

Step-by-step sequence:
1. Use \`review_codex\` with \`view: "flags"\` to load the current queue.
2. Filter attention to beliefs with \`stale\` or \`fading\` reason codes.
3. For each stale belief, use \`inspect_codex_item\` to see the full detail and decide:
   - If the claim is still valid: use \`revise_belief\` with \`action: "confirm"\` to refresh it.
   - If the claim has changed: use \`revise_belief\` with \`action: "correct"\` with the updated claim.
   - If the claim is no longer relevant: use \`revise_belief\` with \`action: "forget"\`.
4. After processing, use \`review_codex\` with \`view: "status"\` to verify integrity has improved.

Validation checks:
- The processed beliefs no longer appear in the flag queue.
- Confirmed beliefs show refreshed \`verifiedAt\` and incremented evidence.
- Corrected beliefs show proper lineage with version diff.
- Integrity has risen.

Pitfalls:
- Do not confirm stale beliefs automatically without re-evaluating whether the claim still holds.
- Do not forget beliefs that are merely old if they are still accurate.
- Do not ignore stale beliefs indefinitely — they drag down integrity over time.

Tips and tricks:
- Beliefs with high evidence that have gone stale are often safe to confirm — they were well-established.
- Beliefs with evidence 1 and source \`inferred\` that are stale often deserve extra scrutiny.
- Batch stale processing works well as a weekly ritual.

Tool calls to prefer:
- \`review_codex\` with \`flags\` and \`status\`
- \`inspect_codex_item\` for detail before action
- \`revise_belief\` with \`confirm\`, \`correct\`, or \`forget\`

Related skills:
- \`review-flags-batch\`
- \`diagnose-declining-integrity\``,
});
