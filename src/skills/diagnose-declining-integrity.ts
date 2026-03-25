import { defineCodexSkill } from './skill_types.ts';

export const diagnoseDecliningIntegritySkill = defineCodexSkill({
	name: 'diagnose-declining-integrity',
	description:
		'Find the root cause when codex integrity is dropping by analyzing status, flags, and trends systematically.',
	content: `# Diagnose Declining Integrity

Primary tools:
- \`review_codex\`
- \`inspect_codex_item\`
- \`revise_belief\`

Goal:
- Identify and address the systemic cause of declining integrity rather than treating symptoms one belief at a time.

When to use:
- The integrity score has been dropping across review cycles.
- Flag counts are rising faster than they are being resolved.
- Status shows an unusual distribution of weak or stale beliefs.

When not to use:
- Integrity is stable and flags are manageable — standard flag processing suffices.
- You have a specific belief to fix rather than a systemic concern.

Step-by-step sequence:
1. Use \`review_codex\` with \`view: "status"\` to see integrity, strength distribution, certainty distribution, and evidence distribution.
2. Identify which area is dragging integrity down: low strength count, certainty skew, or evidence drought.
3. Use \`review_codex\` with \`view: "flags"\` to see the flag queue and identify the dominant reason codes.
4. Use \`review_codex\` with \`view: "trends"\` to check whether the problem is worsening over time (rising revisions, declining confirmations).
5. For the top-priority flagged beliefs, use \`inspect_codex_item\` to understand why they are flagged and what they have in common.
6. Batch-process the highest-priority flags using the right verbs: confirm, correct, forget, or defer.
7. After processing, use \`review_codex\` with \`view: "status"\` again to confirm integrity has recovered.

Validation checks:
- The root cause was identified (staleness? single-evidence? low trust?) before mass action.
- Flags were processed using the right verbs, not blanket-confirmed.
- Integrity improved after the batch.
- Trends show stabilization.

Pitfalls:
- Do not blanket-confirm all flagged beliefs to boost integrity artificially.
- Do not focus only on the highest-count reason code; check whether multiple codes overlap on the same beliefs.
- Do not skip the trends view — it shows whether this is a new problem or a chronic pattern.

Tips and tricks:
- If \`strengthCounts.weak\` is disproportionately high, the codex has too many low-evidence inferred beliefs.
- If \`stale\` is the dominant flag reason, a freshness pass is overdue.
- If \`unstable\` is the dominant flag reason, beliefs are being revised too frequently — look for oscillating corrections.

Tool calls to prefer:
- \`review_codex\` with all three views: \`status\`, \`flags\`, \`trends\`
- \`inspect_codex_item\` on representative flagged beliefs
- \`revise_belief\` for batch resolution

Related skills:
- \`review-flags-batch\`
- \`process-stale-beliefs\`
- \`run-calibration-pass\`
- \`monitor-portfolio-health\``,
});
