import { defineCodexSkill } from './skill_types.ts';

export const upgradeSourceEvidenceSkill = defineCodexSkill({
	name: 'upgrade-source-evidence',
	description:
		'Promote a belief from a weaker source to a stronger one when direct evidence arrives, using correct to preserve lineage.',
	content: `# Upgrade Source Evidence

Primary tools:
- \`inspect_codex_item\`
- \`revise_belief\`

Goal:
- Strengthen a belief's foundation by recording when indirect evidence is replaced by direct evidence, preserving the promotion in lineage.

When to use:
- An \`inferred\` or \`distilled\` belief is now directly confirmed through observation or explicit statement.
- Evidence quality has improved and the belief should reflect the stronger source.

When not to use:
- The claim itself has changed — that is a correction, not a source upgrade.
- The belief is already at the strongest appropriate source level.

Step-by-step sequence:
1. Use \`inspect_codex_item\` on the current belief to see its claim, source, certainty, and evidence count.
2. Use \`revise_belief\` with \`action: "correct"\` providing:
   - The same claim text (unchanged).
   - The upgraded source (e.g., from \`inferred\` to \`observed\`, or from \`distilled\` to \`explicit\`).
   - Optionally a higher certainty if the stronger source warrants it.
3. Verify the response shows the new belief with the upgraded source.
4. Use \`inspect_codex_item\` on the new belief to confirm lineage shows the source promotion in the version diff.

Validation checks:
- The new belief has the upgraded source.
- Lineage shows the promotion: old source → new source with the same claim.
- Certainty reflects the new evidence quality, not the old default.

Pitfalls:
- Do not skip using \`correct\` and instead just confirm — confirm does not change the source.
- Do not inflate certainty beyond what the new evidence warrants.
- Do not upgrade to \`explicit\` when the evidence is only \`observed\`.

Tips and tricks:
- Source upgrades with the same claim text are visually clean in lineage — only the source changes.
- This is one of the most common post-ingestion maintenance operations.
- Combine with calibration: if inferred beliefs are frequently upgraded, future ingestion should start at higher certainty.

Tool calls to prefer:
- \`inspect_codex_item\` before and after
- \`revise_belief\` with \`action: "correct"\` and upgraded source

Related skills:
- \`correct-belief-lineage-honestly\`
- \`run-calibration-pass\``,
});
