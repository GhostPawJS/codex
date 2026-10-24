# Concept: GhostPaw Codex

## Diagnosis
The owner reviewed the live paper page on 2026-10-24 and rejected the visual direction across the GhostPaw site: index cards, ink and stamps read as an office archive, not as GhostPaw. What stays strong: the five-move drill with values from a real codex 0.3.0 run, the record form, the numbers and the stated limits. What changes: palette, type, form, imagery and motion move to the shared dark spectral identity; the belief card becomes a lit pane, the carbon copy becomes a dimmed afterimage.

## Voices
- The fear that recurs most: one agent saves a wrong fact and every other agent treats it as ground truth. V008 V012 V013 V014 V015 V019
- Buyers want to read, correct and delete what the agent believes, one line at a time, not debug an embedding. V010 V016 V022
- They ask where a memory came from and which agent wrote it; provenance and expiry are named as the real product. V011 V019 V026 V038
- Forgetting is "the hard half": recall is easy to test, noticing a fact was withdrawn is what goes wrong. V015 V047 V049 V059 V060
- MEMORY.md grows into a "junk drawer" and stale lines start contradicting new ones. V001 V006 V009 V054 V005
- Every remembered line is paid for again on every turn. V009 V048 V053 V058
- A loud minority says turn memory off and keep agents stateless, because unread memories pile up. V029 V066 V067
- Many workarounds are plain files with dates and owners: "short dated sentences", "delete what is stale". V010 V022 V017
- Creators explain memory as files that persist across compaction and sessions. V068 V074 V075

## Buyer
A Node.js developer running a persistent agent whose MEMORY.md has started to lie: stale decisions, duplicates, a wrong fact another agent repeated (V006 V013 V018). They come from a thread about memory rot or from the GhostPaw home page, compare against keeping the markdown file, the MCP knowledge graph server and hosted memory services (V044 V046 P011 P001), and need to believe that the store will let them see why the agent believes something and fix it in one call (V010 V011). The hesitation most likely to stop them: memory itself makes agents worse (V067 V066), so the page leads with correction and decay, not with recall.

## Decision path
1. Is this for the wrong-fact problem I have? → hero names it and shows one belief card with source and certainty.
2. What happens to a wrong fact? → the drill: remember, flag, correct with lineage, stale after 90 days, retire.
3. Is it small and local? → numbers beside the claim: 0 runtime dependencies, Node 24+, 32.5 KB gzip, about 4 ms import, 378 tests, one SQLite file.
4. Will it bloat my prompts or make the agent worse? → objection answered in place: recall returns only active beliefs, flags show what to prune, retire hard-deletes.
5. How do I start? → install line, the five-line quick start, GitHub and the live Belief Console demo.

## Mechanism
Chosen: the wrong-fact drill, a five-step walk-through of one belief card using codex's documented verbs (remember, recall, correctBelief, the stale flag, retire). Each step shows the card's fields and the exact call beside it; every value on the card is real output from codex 0.3.0 run with a fixed clock. Speed: the first step is visible on load; proof: every field and verb is from the README and the live demo is linked for the real thing; effort: one button per step; honesty: labelled as a walk-through of documented behaviour, no invented numbers; share value: a step can be linked (`?step=3`).
Rejected: a recall benchmark chart: other projects lead with benchmarks (P001 P006) and we have no benchmark of our own to show.
Rejected: an embedded copy of the live Belief Console: it is a whole app; on a phone it would bury the answer, so it is linked instead.
Rejected: a plain API reference: the README and docs already do that, and it does not answer the wrong-fact question.

## Offer
Product: @ghostpaw/codex, an open-source belief and memory engine for Node.js on SQLite
Price: free, MIT licence
Delivery: `npm install @ghostpaw/codex` into a Node.js 24+ project (tables go in a node:sqlite database the caller opens), or `npx -y @ghostpaw/codex mcp` as a local MCP server

## Facts
- codex 0.3.2 is on npm with zero runtime dependencies and requires Node.js 24+ for node:sqlite. https://www.npmjs.com/package/@ghostpaw/codex
- Since 0.3.0 the package also runs as an MCP server (`npx -y @ghostpaw/codex mcp`) and a CLI (ghostpaw-codex), generated from the same seven tools. https://github.com/GhostPawJS/codex
- The model has five concepts: belief, dismissal, flag, proximity and lineage. https://github.com/GhostPawJS/codex
- A belief carries a claim, source (explicit, observed or inferred), category, certainty, evidence, freshness and revision lineage. https://github.com/GhostPawJS/codex
- Flags are computed at read time: stale (not confirmed in 90 days), fading (freshness below 50%), low trust (inferred, at most 60% certainty), single evidence, gap. https://github.com/GhostPawJS/codex
- correctBelief supersedes the old belief and creates a new one, kept in a lineage chain with version diffs. https://github.com/GhostPawJS/codex
- retire_belief (write.deleteBelief) hard-deletes a belief and its whole lineage chain for privacy or cleanup. https://github.com/GhostPawJS/codex
- Seven tools for agents: search_codex, review_codex, inspect_codex_item, remember_belief, revise_belief, retire_belief, dismiss_proximity. https://github.com/GhostPawJS/codex
- Recall is hybrid: FTS5 preselection plus local cosine similarity over trigram-hash embeddings, fused with reciprocal rank fusion; no model call. https://github.com/GhostPawJS/codex
- Every write returns semantically nearby beliefs so near-duplicates surface at once. https://github.com/GhostPawJS/codex
- dist/index.js of 0.3.2 is 31.5 KB gzip and imports in about 2.5 ms on the maintainer box (median of 11, re-measured at low load); 380 tests pass, measured 2026-10-24. https://github.com/GhostPawJS/codex
- One audit found 26 of 45 auto-saved memories never read once. V066

## Axes
| Axis | Market | Voices | Chosen |
| --- | --- | --- | --- |
| Opening | memory that persists, learns or scales P001 P006 P007 | the wrong fact everyone trusts, the hard half is forgetting V013 V015 | open on the wrong fact and its correction |
| Proof | stars and benchmarks P004 P005 P010 P012 | wants to read and delete each belief V010 V016 | the card itself: every field visible, plus measured package numbers |
| Mechanism | hosted API, SDK quickstart or plugin P001 P006 P012 | correction, expiry, provenance V011 V019 V059 | a step-through drill of one belief's life |
| Palette | light with one accent P001 P003 P004 | watches memory in terminals; fears stale context and ghost vectors V067 V073 V025 | near-black void, spectral cyan for live beliefs, wraith violet for superseded afterimages, alarm rose for flags, ward green for confirmed |
| Imagery | none or code UI P008 P010 P011 | films memory screens in the terminal V067 V073 | generated spectral line art: a ghost paw on a lit belief card, a cracked memory shard; the rest is the live card in HTML |
| Tone | confident claims, "default engine" P006 P007 | wary, plain, admits limits V029 V067 V022 | plain maintainer notes, limits stated |

## Sparks
- "Wrong fact": one bad belief every agent trusts. V008 V013 V015 V019
- "Short dated sentences" you can delete. V010 V022
- "Junk drawer" memory files. V001 V009
- Forgetting as the hard half. V015 V049

## Directions
1. Memory that persists: hero claims the agent never forgets, with a recall demo. V072 → struck: first direction; it is the market opening (P001 P012) and the claim the voices distrust.
  pushed: a chat mock that remembers your name; a competitor drops in unchanged.
2. Graph view: beliefs as a knowledge graph animation. V026 → struck: second direction; graphs are Cognee's and the MCP server's picture (P005 P011).
  pushed: an interactive graph; pretty, slow on phones, says nothing about correction.
3. Wrong-fact drill: one belief card goes wrong and gets fixed in five steps with the real verbs. V013 V015 V010 → struck: built as paper index cards, then rejected on owner review on 2026-10-24; the drill survives inside direction 9.
  pushed: the card carries its source, certainty and flags; the correction leaves a superseded card underneath like a carbon copy, so lineage is visible.
4. Junk drawer cleanup: a MEMORY.md on screen that the visitor sorts into beliefs and deletes. V009 V001 → struck: slows first value and needs invented sample content.
  pushed: a sorting game with fake lines; fun for a minute, answers late.
5. Token meter: count what a growing MEMORY.md costs per turn versus a recall. V009 V048 → struck: would need token numbers we have not measured.
  pushed: a slider of turns versus cost; invented maths.
6. Provenance receipt: every belief printed as a receipt with source and timestamp. V011 V019 → struck: works with any product swapped in; becomes a detail of the card instead.
  pushed: the receipt edge survives as the card's footer line.
7. Ninety-day clock: a calendar showing beliefs going stale over time. V004 V006 → struck: one step of the drill, not a page.
  pushed: kept as step four.
8. Plain README page: install, quick start and tools table. V017 → struck: matches the market baseline (repo page, P010 P011 P012).
  pushed: the README stays one click away.
9. Afterimage: the same five-move drill on a dark scope; each belief is a lit pane, a correction leaves the old belief behind as a violet afterimage, and retire switches the pane off. V013 V015 V067 V025 → chosen
  pushed: the GhostPaw paw leaves its print on the live card in the hero art; flags glow alarm rose exactly where codex computes them.

## Concept
One belief, five moves, on a dark scope. The page centres on a single belief pane, "The API uses GraphQL with a REST fallback", taken from the README's own example. Step one remembers it as inferred; the pane shows the low-trust flag in alarm rose, because the wrong fact every agent trusts is what buyers fear (V013). Step two is recall: another session finds it, flag and source attached. Step three corrects it; the old belief stays behind the new pane as a dimmed violet afterimage marked "superseded", and lineage reads "supersedes #1" (V059 V047). Step four jumps ninety days: unconfirmed, freshness falls to 37% and the pane is flagged stale (V006). Step five retires it: the belief and its lineage are hard-deleted, the pane goes dark and recall returns nothing (V016). Each step shows the exact call beside the pane, the way developers watch memory in a terminal (V067). The forgetting half is the story; recall is one step of five.

## Spine
1. Hero: "When one agent saves a wrong fact, every agent trusts it." Subline on what codex records; install line, GitHub, live demo; a "0 runtime dependencies" readout; generated art of a ghost paw on a lit belief card. V013 V015
2. The drill: five steps, card plus call, step one shown on load. V010 V011 V059
3. What a belief records: the fields as a labelled form (claim, source, category, certainty, evidence, freshness, lineage). V019 V026
4. If memory worries you: active-only recall, flags tell you what to prune, retire deletes, the database is a file you can open with sqlite3. V067 V066 V048
5. Numbers: 0 runtime deps, Node 24+, 32.5 KB gzip, about 4 ms import, 378 tests, 7 tools. V017
6. Start: install, quick start code, GitHub, README, live demo, back to the GhostPaw home.
7. Footer: Impressum, Datenschutz.

## Palette
| Role | Color | Source |
| --- | --- | --- |
| void | #04070b | the night behind the ghost; the owner asked for a deep near-black ground, and every peer page is white or stone P002 P004 P006 |
| panel | #0a1119 | a terminal pane one step above the void; creators film agents in terminals V067 V073 |
| rule | #1d2c3c | pane borders and the faint HUD grid |
| ghost | #e3edf5 | spectral white for body text, cold not cream |
| haze | #93a5b9 | secondary text, the glow a ghost leaves |
| spectral | #62e6f2 | the ghost's cold cyan: primary actions, available, measured values |
| wraith | #b39dff | the afterglow: in progress, superseded, structure lines |
| alarm | #ff7aa6 | flags, refusals, blocked and overdue |
| ward | #7af0b4 | confirmed and done |

## Type
| Role | Family | Source |
| --- | --- | --- |
| display | Tektur, Bahnschrift, Arial Narrow, sans-serif | a squared, width-variable display face that reads like HUD lettering and stretches from condensed tabs to wide headlines; one family carries the GhostPaw name |
| body | system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif | the reader's own interface sans, which stays readable in long paragraphs on a dark ground and costs no download, so the two loaded faces carry the identity |
| code and file names | Martian Mono, Cascadia Mono, Consolas, monospace | crisp, slightly narrow mono for install lines, calls and file names like MEMORY.md V010 |

## Form
The belief is a pane: panel ground, 1px rule border, a 3px top bar in alarm rose while flagged and ward green once confirmed, and a 12px chamfer on the top right corner like a HUD frame. No drop shadows; a soft glow only on the live pane's top bar. A superseded belief sits behind and below the current pane as a violet-edged afterimage with its claim struck through. Steps are numbered tabs with a glowing underline. One column on phones with the call under the pane; on desktop the pane and the call sit side by side. The page ground is plain void with one faint cyan glow at the top right.

## Imagery
| Image | Job | Art direction | Source |
| --- | --- | --- | --- |
| hero paw on belief card | protagonist | a translucent holographic card drawn in cyan light with a glowing ghost paw print on it and a small rose flag on its corner, violet afterimage cards behind, on pure black; no people, no logos V067 V073 | generated |
| memory shard | atmosphere | a cracked shard of cyan light dissolving into violet particles, the wrong fact breaking up, on pure black V025 | generated |
| share card | share preview | the hero art with the headline in the display face at 1200×630 | generated art, rendered from HTML |

## Motion
Moment: on first load a single cyan scan line sweeps down over the hero art once (900 ms) and the art resolves behind it.
Feedback: on step three the old belief slides back behind the new pane and dims to its violet afterimage (300 ms); flags light up with a 150 ms fade; the chosen step tab gets a glowing underline.
Reduced motion: no sweep; panes swap without movement and the afterimage is shown in place.

## Copy
- Use: "wrong fact", "read and delete", "source", "certainty", "stale", "superseded" V013 V010 V011 V006
- Use: "the hard half is forgetting" V015
- Avoid: "never forgets", "remembers everything", "permanent memory", "supercharge" V072 V073
- Avoid: "default engine", "governed for the enterprise" P006 P007
- Plain, second person, short sentences; state limits: Node 24+, one local SQLite file, recall is lexical plus local similarity, not a language model. V017 V022
- Never present voices as customers; describe what developers report in our words. V010 V014

## Changelog
- 2026-10-24: portal chrome pass. Shared top bar (GhostPaw/<lib>, Live demo or Docs, GitHub, npm), version badge, footer row of all seven libraries; sibling links row dropped from the start section; import time re-measured at low machine load; the ruled grid on the page ground was replaced by one radial glow (lfm 0.1.9 rejects ruled ground textures); share card relabelled GhostPaw/<lib> with the install line.
- 2026-10-24: codex 0.3.2 on npm. The five drill steps re-run against 0.3.2 with the same clock (same certainty, freshness, flags and deleted ids); kicker, intro, JSON-LD version and numbers updated (31.5 KB gzip, 380 tests from the v0.3.2 tag).
- 2026-10-24: visual rebuild after owner review: paper index cards replaced by the shared dark spectral identity (void, spectral cyan, wraith violet, alarm rose, ward green; Tektur, system sans, Martian Mono; generated paw-on-card and memory-shard art). Drill values, numbers and copy rules kept; direction 3 struck and direction 9 chosen.
- 2026-10-24: codex 0.3.0 shipped during the build (MCP server, CLI); facts, numbers and limits updated; card values now come from running 0.3.0.
- 2026-10-24: first concept from the batch of 2026-10-24 (75 voices, 12 peers).
