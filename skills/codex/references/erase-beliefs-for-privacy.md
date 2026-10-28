# Erase Beliefs For Privacy

Primary tools:
- `inspect_codex_item` (CLI: `ghostpaw-codex belief show`)
- `revise_belief` (CLI: `ghostpaw-codex belief confirm|correct|merge|forget|defer`)
- `retire_belief` (CLI: `ghostpaw-codex belief retire`)
- `review_codex` (CLI: `ghostpaw-codex review`)

Goal:
- Remove beliefs containing sensitive or personal information, choosing the right erasure level for the situation.

When to use:
- A user requests that personal data be removed.
- Sensitive information was captured accidentally.
- Compliance requires certain data to be fully purged.

When not to use:
- The belief is merely outdated but not sensitive — use `forget` through the normal revision flow instead.
- You want to correct a belief's content — use `correct` to preserve lineage.

Step-by-step sequence:
1. Use `inspect_codex_item` (CLI: `ghostpaw-codex belief show`) on the target belief to see its lineage depth and any beliefs that superseded by or depend on it.
2. Assess the blast radius: lineage depth tells you how many related beliefs exist in the chain.
3. Choose the erasure level:
   - **Soft removal**: use `revise_belief` (CLI: `ghostpaw-codex belief confirm|correct|merge|forget|defer`) with `action: "forget"`. The claim exits active recall but lineage is preserved for audit.
   - **Hard erasure**: use `retire_belief` (CLI: `ghostpaw-codex belief retire`). This permanently deletes the belief and its entire lineage chain from the database.
4. After erasure, use `review_codex` (CLI: `ghostpaw-codex review`) with `view: "status"` to confirm belief counts changed as expected.
5. If hard erasure was used, verify the `deletedIds` in the result covers the full lineage.

Validation checks:
- The target belief is no longer retrievable via `search_codex` (CLI: `ghostpaw-codex search`).
- For hard erasure, `inspect_codex_item` (CLI: `ghostpaw-codex belief show`) on the old id returns a not-found error.
- Status reflects the reduction in total beliefs.
- Lineage chain members were also removed in hard erasure.

Pitfalls:
- Do not use hard erasure when soft removal suffices — audit trails have value.
- Do not forget to check lineage depth before hard erasure; you might delete more beliefs than expected.
- Do not assume soft removal hides the claim from all surfaces — it remains in lineage but exits active recall.

Tips and tricks:
- For GDPR-style requests, hard erasure (`retire_belief` (CLI: `ghostpaw-codex belief retire`)) is usually required.
- For internal hygiene where audit matters, soft removal (`forget`) is preferred.
- Always inspect before erasing — the lineage might reveal related beliefs that also need attention.

Tool calls to prefer:
- `inspect_codex_item` (CLI: `ghostpaw-codex belief show`) to assess blast radius
- `revise_belief` (CLI: `ghostpaw-codex belief confirm|correct|merge|forget|defer`) with `action: "forget"` for soft removal
- `retire_belief` (CLI: `ghostpaw-codex belief retire`) for hard erasure
- `review_codex` (CLI: `ghostpaw-codex review`) with `status` to verify

Related skills:
- `resolve-near-duplicate-beliefs`
- `review-flags-batch`