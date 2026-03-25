import { defineCodexSkill } from './skill_types.ts';

export const reviewFlagsBatchSkill = defineCodexSkill({
	name: 'review-flags-batch',
	description:
		'Process a queue of flagged beliefs, triaging each by its reason code with the right revision verb.',
	content: `# Review Flags Batch

Primary tools:
- \`review_codex\`
- \`inspect_codex_item\`
- \`revise_belief\`
- \`dismiss_proximity\`

Goal:
- Work through the flag queue systematically, making the smallest honest revision per belief to restore codex integrity.

When to use:
- Regular maintenance is due (daily, weekly, or after a batch of changes).
- Integrity has dropped and flags are accumulating.

When not to use:
- You are looking for a specific belief by topic — use \`search_codex\` instead.
- You are responding to one specific known belief — go straight to \`inspect_codex_item\`.

Step-by-step sequence:
1. Use \`review_codex\` with \`view: "flags"\` to load the current flag queue.
2. For each flagged belief, read the \`reasonCodes\` array to understand why it surfaced.
3. Use \`inspect_codex_item\` on the belief to see full detail, lineage, and proximity before acting.
4. Choose the right verb based on the reason code:
   - \`stale\` or \`fading\`: confirm if still valid, correct if the claim has changed, forget if irrelevant.
   - \`single_evidence\`: confirm to add evidence, or defer if verification is not possible yet.
   - \`low_trust\`: confirm with stronger evidence, correct with upgraded source, or forget if unreliable.
   - \`unstable\`: inspect lineage to understand why revision depth is high, then stabilize through confirm or correct.
   - \`gap\`: note the category imbalance and consider whether missing beliefs should be captured.
5. If \`inspect_codex_item\` reveals proximity matches, evaluate whether the flagged belief overlaps with a neighbor. Use \`dismiss_proximity\` for false positives.
6. After processing the batch, use \`review_codex\` with \`view: "status"\` to confirm integrity has improved.

Validation checks:
- The flag queue is smaller after the batch.
- Integrity has risen or stabilized.
- No belief was confirmed without genuine re-evaluation.

Pitfalls:
- Do not confirm every flagged belief automatically just to clear the queue.
- Do not forget beliefs that might still be valid just because they are old.
- Do not skip inspection before acting — the reason code alone is not enough context.
- Do not ignore proximity matches that appear during inspection.

Tips and tricks:
- Process highest-priority flags first; \`reviewPriority\` already ranks them.
- Beliefs with multiple stacked reason codes are the most urgent.
- Defer is a legitimate action when judgment depends on a future outcome.

Tool calls to prefer:
- \`review_codex\` with \`flags\` for the queue and \`status\` for the result
- \`inspect_codex_item\` before every revision
- \`revise_belief\` with the per-code verb
- \`dismiss_proximity\` for false positive proximity pairs

Related skills:
- \`process-stale-beliefs\`
- \`defer-beliefs-pending-outcomes\`
- \`diagnose-declining-integrity\``,
});
