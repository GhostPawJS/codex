---
name: lfm-design
description: Turns an lfm project's research into concept.md, the single brief implementation builds from - buyer, decision path, mechanism, design axes, the chosen direction, page spine, palette, type, form, imagery, motion and copy, every decision cited to research IDs. Use after research is collected and before building or rebuilding a page, when new research batches should reshape an existing page, or when asked to design, concept or art-direct an lfm page. Not for collecting research or writing the page's code.
license: MIT
compatibility: Needs the research files of the project; works with any toolset. Running lfm compile checks the result.
metadata:
  lfm-version: "0.1.9"
  lfm-sha256: "2c522d57c2f551a8169f692b02d1d13a9737372fe542b802c8558b43cdb57543"
---

# Design for an lfm page

The page a model designs from its own taste is the typical page. This skill designs from the research
instead: what buyers wrote decides what to match, what competitors show decides what to break from, and
every decision in concept.md names the evidence it stands on. concept.md is the only file you write; it is the
whole brief for implementation, so a decision missing from it is a decision nobody made.

## Rules that always hold

1. **The research is the only source of taste.** Read research/human-voices.md and
   research/competitor-analysis.md in full and cite them by ID (`V012`, `P003`) wherever a decision
   rests on them. Your own preferences, other projects and example pages are not evidence; they pull every
   page toward the same average.
2. **Derive, do not recall.** Work from the files as they are now. When a concept exists, read it, but
   re-derive the voices and axes from the research rather than copying the old interpretation forward.
3. **Write only concept.md.** No markup, styles or assets in this phase; implementation follows the file.
4. **Strike before you choose.** The first two directions you write are the most probable ones; they are
   always struck. Choose by recorded criteria, never by which direction feels best, because preference
   favours the typical.
5. **Check defaults after choosing, never before.** `lfm compile` reports generator defaults in palette,
   type and imagery once the concept is written; naming them while ideating makes them likelier.
6. **Never invent what the owner decides.** The product, price and delivery come from the owner, the
   project or the user; content the mechanism needs comes from sources. Write `Open: <question>` for
   whatever you cannot source, and implementation resolves it before building that part.

## Before you start

- Run `lfm compile` if you can. Its report must show a `research` line and no `research.*` findings: the
  minimums (60 voices from 5 platforms, 12 peers) are met or a shortfall is named. Otherwise collect
  research first (`lfm skills research`).
- Choose the mode:
  - **New**: no concept yet. Write every section.
  - **Rebuild**: a page exists without a concept (the starter page of `lfm init` does not count). Write
    `## Diagnosis` first (what is generic, what is strong, what the visitor came to do), then set the old
    page aside until a direction is chosen.
  - **Grow**: research gained a batch since the concept's last changelog entry. Re-derive voices and axes
    from the whole files, then classify each change: depth (a new phrase, objection or proof: edit the
    affected sections), shift (an axis moves because the balance of evidence flipped, not because new
    items are vivid: redo only the decisions on that axis), or reset (the buyer or the core job was wrong:
    start a new concept). Keep the `## Qualities` intact unless the evidence says otherwise, and log it.
  - **Reformat**: `lfm compile` reports format findings in a concept that was valid before (a newer lfm).
    Move the content into the current format without re-deriving decisions, and log it.

## Workflow

Work through the sections in order; each builds on the one before.

1. **Voices.** Code the voices: the phrases buyers use, the feelings they want and dread, their rituals
   and in-jokes, what they photograph and film and how, their complaints about current options. At least
   8 observations, each citing its voices. When the research reaches wider than the
   offer, code what concerns the offer's job and say in Buyer which part of it the page serves.
2. **Buyer.** Who arrives, from where, what just happened, what they compare against, what they must
   believe to pay, and the hesitation most likely to stop them.
3. **Decision path.** The visitor's questions in order, each with the job of the section that answers it:
   recognize the offer, get first value, see proof beside the claim, meet the objection at the decision,
   the offer itself, what happens after paying. At least 3 steps.
4. **Mechanism.** What the visitor does on the page: a tool or calculator, a configurator, a sample to read
   or use, an explainer, a diagnostic or quiz, a comparison, a game, a simulation, or a plain answer. Score
   the candidates on speed to first value, strength of proof, effort, honesty risk and share value. Choose
   one, reject at least 2 with reasons. A plain page wins when it serves best. Data
   the mechanism needs and the research lacks is an `Open:` line.
5. **Offer.** What the buyer pays for, the price and how it arrives, from the owner, `lfm.json` or the user.
   Research tells you the hesitations around it, not the facts.
6. **Facts.** At least 10 checked facts true of this subject and hardly any other: numbers, units
   and timings, textures, sounds and light, tools and vocabulary, failure modes and rituals, places. Words
   that only rate or label a style are not facts; a fact can be checked against the subject. Each fact cites its source; a relative Markdown link such as `[theme](assets/theme.css)` counts when it names an existing file inside the project, including through symlinks.
7. **Axes.** At least 5 design axes on which the data separates. Per axis: the market
   position with the peers that hold it, the voice position with the voices that hold it, and your chosen
   position: break from the market where it clusters, match the voices; where both agree, the axis is free,
   so choose by the spine and the sparks. Then imagine the page a generator makes for this topic with no
   research; if a chosen position lands there, it is no break, unless it is the subject's literal material
   and the voices support it.
8. **Sparks.** 3 to 5 details that are specific, surprising, recur in the voices (two or more
   IDs each) and appear in no peer. Check research/competitor-analysis.md before you call something unused.
9. **Directions.** Write at least 8 directions fast, each built from a spark and three facts,
   seen through ordinary people in the topic rather than a visionary. Make them differ in representation
   (scene, notation, data, type, sound, plain tool), interaction, time and what the visitor takes away.
   Write them in the order they come. Push each one further, on a continuation line, before judging any.
   Then strike, with the reason: the first two; any whose one-line description still works with a
   competitor's product swapped in; any that matches the market baseline on opening, palette, imagery or
   mechanism; any that slows the first value; any that is merely tasteful where the voices are not. Mark
   exactly one as chosen.
10. **Concept.** The chosen direction, pushed once more: what would make it astonishing without slowing
   the visitor? Say how it builds on its sparks.
11. **Spine.** The page's sections in order, each with its job and the evidence it shows.
12. **Visual system.** Grounds are white, cool or neutral grey, dark, or a saturated colour from the subject;
    never cream, beige, ivory or other warm off-whites, and no paper, parchment or notebook styling
    (grain/noise overlays, ruled lines, torn edges as page decoration); the compiler fails on them.
    Derive palette, type, form, imagery and motion from the concept and the axes. For
    each, list about eight candidates of your own in your notes (not in the file), estimate the chance a
    typical generator picks each, and
    choose one below roughly 10% that serves the spine. Cite a voice, peer or fact for it: type and form
    rarely appear in voices, so derive them from facts and the topic's own artifacts (signs, labels, tools,
    documents) and cite those. The facts narrow the field; the final face among the fitting ones is a
    choice, so say what the face must do and pick one that does it. Declare every color the page will use;
    the compiler checks that a text and ground pair reaches 4.5:1. Plan the images by job (protagonist,
    proof, atmosphere, explanation, share preview), with art direction taken from what the buyers
    photograph and film. Decide one orchestrated motion moment, the feedback motion, and what the page
    shows with reduced motion.
13. **Copy.** The buyers' own words to use, the tone, and the words to avoid, each citing voices. Write the
    exact phrases as `Use: "…"` and `Avoid: "…"` lines; `lfm compile` holds the page to them.
    Only the leading quoted list is banned on an Avoid line; explanation text or IDs
    end the list. `Avoid: "body search"; say "FTS5 search"` bans only "body search".
    On English pages, simple s/es/ed/ing forms of the final Use word count too;
    other languages keep exact word forms and show near-match hints.

For a hub that routes to other pages and sells nothing itself, the next step is a named link per product page with ItemList JSON-LD; Offer and BuyAction stay on the product pages.

Then run `lfm compile`. Its `Next` line names the step that follows, normally the lfm-implementation skill.

## concept.md format

Use exactly these headings in this order; the words under them are yours. `Diagnosis`, `Qualities` and
`Changelog` are optional; every other section is required. Replace every `<…>`.

```markdown
# Concept: <project>

## Diagnosis
<only when rebuilding: what is generic, what is strong, what the visitor came to do …>

## Voices
- <observation in your words …> V001 V014

## Buyer
<who arrives and why, citing voices …>

## Decision path
1. <question the visitor asks …> → <job of the section that answers it …>

## Mechanism
Chosen: <mechanism and why …>
Rejected: <alternative …>: <why …>

## Offer
Product: <what the buyer pays for …>
Price: <amount and currency …>
Delivery: <how and when it arrives …>

## Facts
- <fact true of this subject …> V007 or P002 or https://source

## Axes
| Axis | Market | Voices | Chosen |
| --- | --- | --- | --- |
| <axis …> | <position …> P001 P004 | <position …> V003 V019 | <position …> |

## Sparks
- <recurring detail no peer uses …> V011 V023

## Directions
1. <name>: <direction …> V011 → struck: <reason …>
  <the direction pushed further …>
2. <name>: <direction …> V023 → chosen
  <the direction pushed further …>

## Concept
<the chosen direction pushed once more, built on its sparks …> V011

## Spine
1. <section …>: <its job and the evidence it shows …>

## Palette
| Role | Color | Source |
| --- | --- | --- |
| <role …> | #rrggbb | <where it comes from …> V005 |

## Type
| Role | Family | Source |
| --- | --- | --- |
| <role …> | <family>, <fallback families>, <generic family> | <why this face …> |

## Form
<shape, corners, edges, elevation and the layout idea …>

## Imagery
| Image | Job | Art direction | Source |
| --- | --- | --- | --- |
| <image …> | <job …> | <art direction …> V008 | <generated, photographed, drawn or rendered …> |

## Motion
Moment: <the one orchestrated moment …>
Feedback: <motion that answers the visitor …>
Reduced motion: <what shows instead …>

## Copy
- Use: "<the buyers' exact phrase …>", "<another …>" V002
- Avoid: "<word the page must not say …>" V030
- <tone and other rules …> V005

## Qualities
- <approved quality implementation must keep …>

## Changelog
- <YYYY-MM-DD>: <what changed, from which research batch, what was kept …>
```

- Citations are bare IDs anywhere in the text: `V003`, `P012`. Every ID must exist in the research files.
- A deliberately imageless page writes `None: <reason>` under Imagery instead of the table.
- `Open: <question>` is a question for the owner, on its own line in any section or as the value of an
  Offer field (`Price: Open: <question>`); `lfm compile` lists each one. Write notes as plain text.
- The verdict ends a direction's first line; the pushed version continues below it.
- Plain-text notes may follow a table; the table itself stays as shown.
- Every list item stays on one line or continues on lines indented by two spaces.

## Validate before finishing

Run `lfm compile` and fix every `concept.*` finding; it checks the sections, the citations and their spread
across voices, platforms and peers, and the generator defaults in palette, type and imagery. `concept.open`
findings stay until the owner answers them; hand them over with the file. Then
reread concept.md as the implementer will:

- Could someone build the page from this file alone, asking only the `Open:` questions? A mechanism that
  needs data the research lacks will have them; that is expected, inventing the data is not.
- Does every axis's chosen position show up in the spine, the visual system or the copy?
- Would the concept still work with a competitor's product swapped in? Then it is a theme; go back to the
  directions.
- Is anything justified by taste, another project or an example page rather than an ID or a fact?

## Gotchas

- A spark that appears in a peer is the market, not a spark.
- Citing many IDs on one line does not make a weak claim strong; cite the voices that actually say it.
- Colors from the tool or kit you would normally use are not research; trace each one to a source.
- Research voices are evidence, not customers: the page never shows them as testimonials or reviews.
- After implementation starts, `lfm compile` holds the page to this file's palette, typefaces and imagery.
  Change the concept first, with a changelog entry, when a decision itself changes.
