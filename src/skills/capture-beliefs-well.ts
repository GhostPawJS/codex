import { defineCodexSkill } from './skill_types.ts';

export const captureBeliefsWellSkill = defineCodexSkill({
	name: 'capture-beliefs-well',
	description: 'Capture one belief per claim with clean source and category choices.',
	content: `## Goal
Capture beliefs as atomic claims.

## Steps
1. Prefer one proposition per belief.
2. Use the strongest honest source.
3. Choose the narrowest fitting category.
4. Call \`remember_belief\`.`,
});
