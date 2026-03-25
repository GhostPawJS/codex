import { defineCodexSkill } from './skill_types.ts';

export const deferBeliefsPendingOutcomesSkill = defineCodexSkill({
	name: 'defer-beliefs-pending-outcomes',
	description:
		'Postpone flag processing for beliefs that cannot be judged yet by deferring them until a future date.',
	content: `# Defer Beliefs Pending Outcomes

Primary tools:
- \`review_codex\`
- \`revise_belief\`
- \`inspect_codex_item\`

Goal:
- Legitimately pause flag processing for beliefs whose truth depends on a future event, without clearing the flag dishonestly.

When to use:
- A flagged belief's accuracy depends on an outcome that has not happened yet (test result, release, decision).
- You cannot confirm or correct now but you know when you will be able to.
- A belief was entered as a prediction and the verification date is in the future.

When not to use:
- You can already judge the belief — act on it with confirm, correct, or forget.
- Deferral would be used to indefinitely postpone maintenance.

Step-by-step sequence:
1. Use \`review_codex\` with \`view: "flags"\` to identify flagged beliefs pending outcomes.
2. Use \`inspect_codex_item\` on the belief to confirm it genuinely depends on a future event.
3. Use \`revise_belief\` with \`action: "defer"\` and a \`deferUntil\` timestamp set to when the outcome is expected.
4. When the deferral period expires, the belief will resurface in the flag queue.
5. At that point, use \`inspect_codex_item\` again and decide: \`confirm\` if the belief held, \`correct\` if the outcome changed it, or \`forget\` if it is no longer relevant.

Validation checks:
- The deferred belief no longer appears in the flag queue until its deferral expires.
- The deferral timestamp is realistic and not set arbitrarily far in the future.
- After the deferral lifts, the belief is processed with the right verb.

Pitfalls:
- Do not defer as a way to avoid dealing with beliefs you could judge now.
- Do not set deferral dates months in the future without a genuine reason.
- Do not forget to return to deferred beliefs when they resurface.

Tips and tricks:
- Set \`deferUntil\` to the earliest date when you expect the outcome, not the latest.
- Deferred beliefs with provenance (like "depends on Q3 results") are easier to revisit.
- Combine with pre-registration: capture a prediction, defer until the outcome date, then correct or confirm.

Tool calls to prefer:
- \`review_codex\` with \`flags\` to find candidates
- \`revise_belief\` with \`action: "defer"\` and \`deferUntil\`
- \`inspect_codex_item\` before and after deferral

Related skills:
- \`review-flags-batch\`
- \`pre-register-beliefs-before-decisions\``,
});
