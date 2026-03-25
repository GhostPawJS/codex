import { defineCodexSkill } from './skill_types.ts';

export const runCalibrationPassSkill = defineCodexSkill({
	name: 'run-calibration-pass',
	description:
		'Detect and respond to systematic overconfidence by inspecting calibration alerts and high-certainty revision patterns in trends.',
	content: `# Run Calibration Pass

Primary tools:
- \`review_codex\`
- \`inspect_codex_item\`

Goal:
- Determine whether certainty estimates are systematically too high by analyzing how often high-certainty beliefs get revised.

When to use:
- \`review_codex\` with \`view: "trends"\` shows calibration alerts.
- High-certainty beliefs are frequently being corrected after short periods.
- You want to assess whether source weights or certainty defaults need adjustment.

When not to use:
- The codex is new and has too few beliefs to show meaningful patterns.
- You need to fix a specific belief rather than assess a systemic pattern.

Step-by-step sequence:
1. Use \`review_codex\` with \`view: "trends"\` to load calibration alerts and revision statistics.
2. Read \`revisedHighCertaintyCount\` and \`repeatedlyRevisedCount\` to assess the scope of the problem.
3. For each calibration alert, use \`inspect_codex_item\` on the revised beliefs to see the version diff: what was the original claim and certainty, and what replaced it?
4. Look for patterns: are overconfident beliefs concentrated in a specific source (e.g., all \`inferred\`) or category (e.g., all \`capability\`)?
5. Adjust future capture behavior: enter beliefs at lower certainty for the problematic source/category combinations.
6. If a currently active belief still has inflated certainty from the old pattern, correct it with a more honest certainty estimate.

Validation checks:
- The trends data was actually read and analyzed, not skipped.
- Version diffs were inspected for the revised high-certainty beliefs.
- Future capture certainty adjustments are informed by the observed pattern.

Pitfalls:
- Do not treat calibration alerts as individual belief problems — they are systemic signals.
- Do not lower certainty on beliefs that were correctly entered at high confidence and held.
- Do not ignore repeated calibration alerts across multiple review cycles.

Tips and tricks:
- A small number of revised high-certainty beliefs is normal. The signal is the rate and recurrence.
- Category-specific overconfidence is common — \`capability\` beliefs are often overrated.
- Calibration passes are most valuable when done quarterly or after large ingestion batches.

Tool calls to prefer:
- \`review_codex\` with \`trends\`
- \`inspect_codex_item\` for version diffs on revised beliefs

Related skills:
- \`monitor-portfolio-health\`
- \`diagnose-declining-integrity\``,
});
