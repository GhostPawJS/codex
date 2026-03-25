import { defineCodexSkill } from './skill_types.ts';

export const correctBeliefLineageHonestlySkill = defineCodexSkill({
	name: 'correct-belief-lineage-honestly',
	description:
		'Use correct instead of forget-and-remember so lineage preserves what changed, when, and why.',
	content: `# Correct Belief Lineage Honestly

Primary tools:
- \`inspect_codex_item\`
- \`revise_belief\`

Goal:
- Preserve epistemic history through lineage so future inspection shows what was believed before and what replaced it.

When to use:
- Understanding has changed and the old claim is no longer accurate.
- A belief needs an updated claim, upgraded source, or recalibrated certainty.

When not to use:
- The belief is still accurate and just needs reinforcement — use \`confirm\` instead.
- The belief should exit active recall entirely — use \`forget\` instead.

Step-by-step sequence:
1. Use \`inspect_codex_item\` on the belief to see the current claim, certainty, source, and existing lineage.
2. Use \`revise_belief\` with \`action: "correct"\` and the replacement \`claim\`. Optionally update \`source\`, \`category\`, or \`certainty\` if those also changed.
3. Check the response: the result includes the new belief id, the \`supersededId\`, and proximity matches for the corrected version.
4. If the correction reveals new proximity conflicts, evaluate them before continuing.

Validation checks:
- The old belief is now superseded and no longer appears in active recall.
- The new belief carries the updated claim at the expected certainty.
- Inspecting the new belief shows a version diff between old and new claims.
- Lineage depth increased by one.

Pitfalls:
- Do not delete the old belief and remember a new one — that destroys lineage.
- Do not use forget followed by remember as a workaround for correction.
- Do not correct a belief that is already superseded; locate the current active version first.

Tips and tricks:
- The version diff in \`inspect_codex_item\` shows exactly what changed — useful for auditing later.
- If only the source needs upgrading (same claim, stronger evidence), correct with the same claim text but a different source.
- Lineage chains become valuable narrative artifacts over time.

Tool calls to prefer:
- \`inspect_codex_item\` before correction
- \`revise_belief\` with \`action: "correct"\` for the actual change

Related skills:
- \`upgrade-source-evidence\`
- \`handle-ambiguous-belief-updates\``,
});
