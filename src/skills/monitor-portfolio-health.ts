import { defineCodexSkill } from './skill_types.ts';

export const monitorPortfolioHealthSkill = defineCodexSkill({
	name: 'monitor-portfolio-health',
	description:
		'Regular status and trends review as a maintenance ritual to catch problems before they compound.',
	content: `# Monitor Portfolio Health

Primary tools:
- \`review_codex\`
- \`inspect_codex_item\`

Goal:
- Perform a lightweight health check on the entire codex, identifying emerging issues before they degrade integrity.

When to use:
- As a periodic ritual (daily, weekly, or after significant changes).
- Before starting a new task that depends on codex accuracy.
- After a batch ingestion or large correction pass.

When not to use:
- You need to find a specific belief — use \`search_codex\`.
- You are already in the middle of flag processing — continue with that skill.

Step-by-step sequence:
1. Use \`review_codex\` with \`view: "status"\` to see integrity, total beliefs, strength distribution, certainty distribution, and evidence distribution.
2. Check integrity: above 0.7 is healthy, 0.5-0.7 needs attention, below 0.5 requires immediate diagnosis.
3. Check strength counts: a high ratio of weak beliefs suggests many unverified entries.
4. Use \`review_codex\` with \`view: "trends"\` to see if metrics are improving or declining.
5. Check calibration alerts: rising revised high-certainty counts signal overconfidence.
6. If flags are accumulating, note the backlog size and dominant reason codes.
7. If anything needs attention, switch to the appropriate skill: \`diagnose-declining-integrity\`, \`process-stale-beliefs\`, \`run-calibration-pass\`, or \`review-flags-batch\`.

Validation checks:
- All three review views were consulted (status, trends, and optionally flags).
- Anomalies were identified and routed to the right remediation skill.
- No silent degradation was ignored.

Pitfalls:
- Do not skip the trends view — status alone is a snapshot, trends show direction.
- Do not act on status alone without understanding why a metric is off.
- Do not treat monitoring as a substitute for active maintenance.

Tips and tricks:
- Log the integrity score after each monitoring pass to track long-term trajectory.
- A stable integrity above 0.7 with a shrinking flag queue means the codex is healthy.
- If integrity is high but trends show rising revisions, calibration may be off.

Tool calls to prefer:
- \`review_codex\` with \`status\` and \`trends\`
- \`inspect_codex_item\` for spot-checking beliefs that represent anomalies

Related skills:
- \`diagnose-declining-integrity\`
- \`run-calibration-pass\`
- \`review-flags-batch\``,
});
