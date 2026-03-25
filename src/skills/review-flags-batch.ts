import { defineCodexSkill } from './skill_types.ts';

export const reviewFlagsBatchSkill = defineCodexSkill({
	name: 'review-flags-batch',
	description: 'Process a review queue of stale, weak, or unstable beliefs.',
	content: `## Goal
Process flag batches without distorting lineage.

## Steps
1. Load \`review_codex\` with \`flags\`.
2. Inspect each belief.
3. Confirm, correct, forget, or defer honestly.`,
});
