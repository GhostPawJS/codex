import { defineCodexSkill } from './skill_types.ts';

export const runCalibrationPassSkill = defineCodexSkill({
	name: 'run-calibration-pass',
	description: 'Inspect high-certainty revisions to detect overconfidence.',
	content: `## Goal
Learn whether certainty estimates are too aggressive.

## Steps
1. Load \`review_codex\` with \`trends\`.
2. Inspect revised high-certainty beliefs.
3. Adjust future certainty judgments.`,
});
