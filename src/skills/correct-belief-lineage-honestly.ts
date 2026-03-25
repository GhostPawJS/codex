import { defineCodexSkill } from './skill_types.ts';

export const correctBeliefLineageHonestlySkill = defineCodexSkill({
	name: 'correct-belief-lineage-honestly',
	description: 'Prefer truthful supersession over silent overwrite.',
	content: `## Goal
Preserve epistemic history when understanding changes.

## Steps
1. Inspect the active belief.
2. Use \`revise_belief\` with \`correct\` when the claim changed.
3. Keep the old belief in lineage.`,
});
