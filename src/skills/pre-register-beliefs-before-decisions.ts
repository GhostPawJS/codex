import { defineCodexSkill } from './skill_types.ts';

export const preRegisterBeliefsBeforeDecisionsSkill = defineCodexSkill({
	name: 'pre-register-beliefs-before-decisions',
	description:
		'Anchor beliefs with honest certainty before outcomes arrive to enable calibration tracking.',
	content: `# Pre-Register Beliefs Before Decisions

Primary tools:
- \`remember_belief\`
- \`revise_belief\`
- \`review_codex\`
- \`inspect_codex_item\`

Goal:
- Record what you believe before you know the outcome, enabling honest calibration and preventing hindsight bias.

When to use:
- A decision or prediction is being made and you want to track how accurate your beliefs were.
- You want to establish a baseline certainty before an event resolves.
- Calibration feedback requires pre-registered beliefs to compare against outcomes.

When not to use:
- The outcome is already known — just capture the fact directly.
- The belief does not have a clear resolution point in the future.

Step-by-step sequence:
1. Use \`remember_belief\` with the prediction claim, an honest certainty reflecting your current confidence, and \`provenance\` noting what outcome will verify this.
2. Use \`revise_belief\` with \`action: "defer"\` and \`deferUntil\` set to the expected outcome date.
3. When the outcome arrives and the belief resurfaces in flags:
   a. Use \`review_codex\` with \`view: "flags"\` to find the resurfaced belief.
   b. Use \`inspect_codex_item\` to see the original version and its certainty.
   c. If the belief held: use \`revise_belief\` with \`action: "confirm"\`.
   d. If the belief was wrong: use \`revise_belief\` with \`action: "correct"\` with what actually happened.
4. Use \`review_codex\` with \`view: "trends"\` to check whether the calibration pattern improved.

Validation checks:
- The pre-registered belief was entered before the outcome was known.
- Certainty reflects genuine pre-outcome confidence, not a hedged or inflated value.
- The belief was resolved (confirmed or corrected) once the outcome arrived.
- Trends show accurate calibration data from the pre-registration.

Pitfalls:
- Do not enter pre-registered beliefs at certainty 1.0 — that defeats calibration.
- Do not correct the pre-registered belief before the outcome is known.
- Do not skip setting provenance — it is the anchor for finding the belief later.
- Do not forget to defer the belief until the resolution date.

Tips and tricks:
- Pre-registration is most valuable for beliefs with certainty between 0.3 and 0.8 — these generate the most calibration signal.
- Record the decision context in provenance so future review has full context.
- Multiple pre-registered beliefs can be entered for competing hypotheses about the same outcome.

Tool calls to prefer:
- \`remember_belief\` with honest certainty and provenance
- \`revise_belief\` with \`defer\` initially, then \`confirm\` or \`correct\` at resolution
- \`review_codex\` with \`trends\` for calibration tracking

Related skills:
- \`defer-beliefs-pending-outcomes\`
- \`run-calibration-pass\``,
});
