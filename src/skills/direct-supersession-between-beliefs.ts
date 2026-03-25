import { defineCodexSkill } from './skill_types.ts';

export const directSupersessionBetweenBeliefsSkill = defineCodexSkill({
	name: 'direct-supersession-between-beliefs',
	description:
		'Express that one belief already covers another by forgetting the weaker one with a successor pointer, without creating new entries.',
	content: `# Direct Supersession Between Beliefs

Primary tools:
- \`inspect_codex_item\`
- \`revise_belief\`

Goal:
- Remove a redundant belief by pointing it to its better counterpart, preserving the supersession record in lineage.

When to use:
- Two beliefs exist about the same topic and one is clearly more authoritative, recent, or comprehensive.
- You want to express "this belief is covered by that one" without creating a new merged entry.
- After a correction created a new belief, the old one should point to the successor.

When not to use:
- Both beliefs add unique information — use merge instead.
- The two beliefs are about genuinely different topics — use dismiss instead.
- You want to create a new combined belief — use merge or correct.

Step-by-step sequence:
1. Use \`inspect_codex_item\` on both beliefs to compare their claims, certainty, evidence, and lineage.
2. Identify the stronger belief (higher evidence, certainty, recency, or source quality).
3. Use \`revise_belief\` with \`action: "forget"\` on the weaker belief, setting \`successorId\` to the stronger belief's id.
4. Verify the response confirms the supersession was recorded.
5. Use \`inspect_codex_item\` on the surviving belief to confirm the lineage shows the supersession.

Validation checks:
- The weaker belief no longer appears in active recall results.
- The stronger belief remains active and unchanged.
- Inspecting the surviving belief shows the supersession in its lineage context.

Pitfalls:
- Do not forget a belief without setting \`successorId\` when a clear winner exists — that loses the relationship.
- Do not supersede the stronger belief by mistake.
- Do not use supersession when the two beliefs are genuinely independent.

Tips and tricks:
- Supersession is cleaner than merge when one belief strictly dominates the other with no unique information lost.
- The superseded belief's claim remains visible in lineage for audit but exits active recall.
- This is the preferred resolution for proximity pairs where one is strictly better.

Tool calls to prefer:
- \`inspect_codex_item\` on both beliefs
- \`revise_belief\` with \`action: "forget"\` and \`successorId\`

Related skills:
- \`resolve-near-duplicate-beliefs\`
- \`correct-belief-lineage-honestly\``,
});
