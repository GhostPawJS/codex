---
name: lfm-implementation
description: Builds or improves the lfm sales page from concept.md - template, styles, scripts, imagery, motion, copy, metadata, sharing and Stripe checkout - and iterates until lfm compile is clean and every frame of the page holds up on phone and desktop. Use when concept.md exists and the page must be built, rebuilt, extended or polished, or when asked to implement, fix or optimize an lfm page. Not for research or for design decisions; those live in their own skills and files.
license: MIT
compatibility: Needs lfm, the project's research files and concept.md. Uses image generation, a browser and screenshots when available, and asks the user for what it cannot produce.
metadata:
  lfm-version: "0.1.9"
  lfm-sha256: "64ec168354e7855476c0f7d1d7859ff9cecc62cfc55011aa064278625b124e2d"
---

# Implement an lfm page

concept.md decided what the page is; this skill makes it real, then makes it excellent in a few
deliberate rounds. The compiler checks what can be measured; you look at what cannot, by viewing the
whole page as a visitor does, frame by frame, on a phone and on a desktop.

## Rules that always hold

1. **concept.md is the brief.** Build its spine, palette, type, form, imagery, motion and copy. When a
   decision has to change, change concept.md first with a changelog entry, citing research, then the page.
   `lfm compile` reports typefaces, colors, imagery and phrases that drift from it.
2. **Real or nothing.** Every fact, number, quote, price, person and photo is true and traceable to the
   research, the config or Stripe. No invented testimonials, ratings, customers, stock people, logos or
   statistics; no placeholders shipped. Research voices are not your customers: say what buyers commonly
   say in your own words, never quote a person as if they had bought. A missing fact is asked for or
   left out.
3. **0 errors, 0 warnings.** The compiler is the floor. Fix the cause a finding names; never silence it.
   `data-design-reason="…"` is only for a choice concept.md states, and its text says that reason.
4. **Look at the whole page after every change.** A fix that looks right in the edited spot often breaks a
   neighbour, the phone layout or a state you did not open. Chosen screenshots are not a review.
5. **Keep what works.** Preserve accepted copy, imagery and the `Qualities` of concept.md. Fix
   locally; rewrite a whole section only when its job fails.

## Before you start

- Read concept.md in full, then the voices it cites in research/human-voices.md, then `lfm.json` and the template.
- Run `lfm compile`. If research or concept findings remain, or concept.md is missing, finish those
  first (`lfm skills research`, `lfm skills design`); building without them produces the typical page.
  `concept.open` lists questions for the owner (price, deliverable, data to source): get the answers and
  write them into concept.md before building the part they affect.
- Choose the mode:
  - **Build**: the template is still the starter. Build the spine first, then the rounds below.
  - **Rebuild**: a page exists and concept.md has a `Diagnosis`. Build the new spine beside the old
    markup, move over only what the concept keeps, delete the rest.
  - **Grow**: concept.md gained a changelog entry. Change only the sections its entry names, then run
    the full review, because local changes shift the whole page.
- Say in one line which capabilities you have: image generation, Chrome for `lfm compile --release`, a
  way to view images, Stripe access. The rounds below name a fallback for each.
- **Done** means: every part of concept.md is built except those waiting on an `Open:` line, the
  compile is clean apart from `concept.open`, and the review below passed. Something you cannot produce
  (an owner's photo, data no source gives) becomes an `Open:` in concept.md where it belongs (an
  image in a cell of its Imagery row), never a stand-in. A spine section that cannot work without it stays
  off the page, and its neighbours read as if it never existed.

## Round 1: the working spine

Make the core loop work with real content before any polish.

1. **Facts into config.** Product values go into `lfm.json` under `data` (offer, price, inputs, delivery,
   FAQ answers); every destination into `urls`, except same-page `#fragment` links. The template renders
   them; it never repeats a literal. Templates are Go `html/template`: config numbers compare by value
   (`{{if ge .data.hours 6}}`) but there is no arithmetic, so store the values the first screen shows in
   `data`, and compute the rest in the script. `lfm help template` lists helpers. Pass multiple
   contexts to partials with `{{template "case" (dict "root" $ "case" .)}}`; read `.root.urls`
   and `.case` inside. Guard optional paths directly with `{{with .data.note}}{{.}}{{end}}`
   or `{{if .data.note}}{{.data.note}}{{end}}`; absent, null and empty values are allowed there.
   `copy.machine` excludes table and role=table/grid content and names up to three review passages with source locations and window-level signals;
   revise the named signal (rhythm or wording) while preserving factual content. `build.browserData` lists the config paths the script needs
   (`"data.check"`); the script reads the same shape back:
   `JSON.parse(document.getElementById("product-data").textContent).data.check`. A value that
   depends on today (this month's task) renders a default that is true all year in HTML, and the script
   replaces it.
2. **One section per spine item**, in order, each doing the job concept.md gives it. Headings name
   what the section answers; one `h1`. Semantic landmarks, native controls, real `href`s.
3. **The mechanism first.** The tool, sample, configurator or game works with real data before anything is
   styled, and the initial HTML already shows a meaningful starting case (a worked example, filled defaults,
   a real excerpt), never an empty box, a zero result or a disabled button. Assumptions behind a result
   (a pot size, a household) are shown next to it and editable where they matter.
4. **Tokens from the concept.** Declare the palette as custom properties named by role, the typefaces of
   the Type table and the Form rules (corners, edges, elevation) once; components use the tokens only.
   Body text meets 4.5:1 against its actual ground, including over images (the release audit measures it
   on flat grounds; over images, check it yourself). Font files are WOFF2 in the
   project (from the foundry or an open font host, with the licence), a small set of
   weights, the variable file when the concept uses an axis such as width, a subset that covers the page's
   language (quotes, umlauts, €). Reference images and fonts from HTML and CSS like any page; lfm packs
   and names them.
5. **Offer and checkout.** The Offer of concept.md: price, what arrives, how and when, beside a native
   `<a href>` to the hosted checkout (see Commerce). The spine decides where the offer section sits; the
   first screen still links to it, so a ready buyer never scrolls the whole story. A page that sells links
   the owner's privacy policy, and in Germany the Impressum; selling digital goods in the EU also needs the
   withdrawal notice and consent to immediate delivery at checkout. Legal text comes from the owner: an
   `Open:` line until it does, never your own wording.

Compile now and fix everything before continuing.

## Round 2: pixels, motion and words

**Imagery.** Produce each image of the Imagery table for its job. Brief every image in writing before
generating it, in your notes or a file outside `assets/`: job and placement; the one visual idea; fixed facts that must stay accurate; medium,
viewpoint, framing and focal point; light source and how the materials respond; palette roles; aspect
ratios with mobile crop and copy space; acceptance criteria. Take art direction from what the buyers
photograph and film (cited in concept.md), not from stock aesthetics. Then:

- Explore a few distinct images, choose, then refine by changing one named fault at a time. Judge every
  revision against the brief, not only against the previous render.
- Inspect at full size and at the sizes it ships: anatomy, hands, contact and shadows, object counts,
  perspective, food and material texture, lettering, domain details. Reject waxy uniform surfaces, global
  glow or bokeh, repeated textures, generic attractive faces and spectacle that forgets the offer.
- Exact text, numbers, logos, charts and interface stay in HTML or SVG, layered over the image.
- Evidence (what the buyer receives or encounters) must be real material; generated images may illustrate,
  never stand in for the product, a place, a person or a result.
- Ship sensibly sized WebP or AVIF with honest dimensions; the hero is never lazy-loaded.
- Fallback ladder: an image generation tool → photos or files from the user → images rendered in code
  (SVG, canvas, CSS) when the concept allows → an `Open:` in the image's row for the owner. Never stock
  or placeholder services.

**Motion.** Build the one orchestrated moment and the feedback motion of concept.md; nothing else
moves by default. Content is readable before and without any animation (no opacity-zero reveals hiding
text). Interrupting or reversing works from the current state. A `prefers-reduced-motion: reduce` rule
shows the concept's reduced state. Anything moving by itself for more than five seconds can be paused.

**Copy.** Write from the Copy section and the voices it cites: the buyers' own words, the stated tone.
`lfm compile` reports a `Use:` phrase the page never says and an `Avoid:` phrase it does.

- Lead with the recognizable situation or useful outcome; name the product plainly. Every section answers
  one of: what is it, is it for me, what do I get, why believe it, what happens next.
- Proof sits beside the claim it supports; conditions stay attached to the promise they limit.
- Action labels name the actual next step and outcome; say when the next step is payment.
- Cut every sentence whose removal changes nothing. FAQs only for real open questions.
- Replace each of these with the concrete point: "in today's world" openers, "seamless", "powerful" and
  other unearned superlatives, repeated "not just X, but Y", habitual triplets, "highlighting its
  importance" endings, recap paragraphs, "we understand how overwhelming…", automatic hedges, curiosity
  bait. `lfm compile` reports the common phrases; the rest is your read-aloud pass.
- In German, choose du or Sie from the voices and keep it; write native phrasing, not translation.

## Round 3: discovery, sharing and commerce

**Search and answers.** `title` names the task or product and its useful distinction; `description`
previews what the page delivers. The answer, offer, evidence and links are in the initial HTML, readable
without clicks or scripts. Each passage stays true when quoted alone: subject, numbers with units, dates,
conditions. Cite primary sources beside checkable claims. Structured data goes in `jsonld` in `lfm.json`,
with values matching the visible page; the compiler emits and checks the block. It generates the
canonical sitemap and, at the host root, robots.txt; private download paths stay unlisted.

**Sharing.** Decide the shared object (a result, comparison, plan or challenge), who receives it and what
they do next. Put only public state in the URL with `URLSearchParams`, restore it on load and handle bad
input; the canonical never changes. The social image shows the offer at thumbnail size with its alt text;
a card drawn in HTML keeps its source in the project (for example `assets/share/card.html`) so it can be
rendered again at 1200×630.
Offer the share after value appears, show what will be shared, and never gate a promised result behind it.
Add platform cards (X player, Discord, Farcaster, Snapchat) only when the audience is there; the compiler
checks their metadata. Set `social.x` to the page’s X handle when known; the compiler fills missing
`twitter:site` and `twitter:creator` tags.

**Commerce.** One Stripe Payment Link per fixed offer, opened by a native link; no Stripe.js, no backend.
Record each offer in `lfm.json` as an object keyed by a plain name, and render its values everywhere:

```json
"urls": { "buyPlan": "https://buy.stripe.com/…" },
"data": { "commerce": { "offers": { "plan": {
  "sku": "plan", "name": "…", "checkoutUrlKey": "buyPlan",
  "price": { "amountMinor": 900, "currency": "EUR" },
  "stripe": { "productId": "prod_…", "priceId": "price_…", "paymentLinkId": "plink_…" } } } } }
```

Stripe IDs are copied from Stripe, or left out when you have no access; never invented. The offer in
`jsonld` binds its name (`"{{.data.commerce.offers.plan.name}}"`), writes the price as the decimal string
(`"9.00"`; the compiler checks it equals `amountMinor`) and carries a `BuyAction` whose target is the
checkout URL. Inputs the delivery needs are Stripe custom fields (at most three); without Stripe access
they are an `Open:` line for the owner, not URL parameters. No secret keys in the project.

## Round 4: review and fix

Run `lfm compile --release`. In headless Chrome it records runtime errors and scrolls the page by half a
screen at 390×844, 1280×680 and 1440×900.
It reports a first screen without heading or control, empty stretches, sideways scrolling, covered, tiny
or low-contrast text, split values, motion that ignores reduced motion and text missing without
JavaScript. It saves every frame; the `frames` line names the folder and, from the second run on, the
frames that changed. Then review by looking:

1. **Frames.** The first time, open every frame in order at full size, phone first; afterwards the changed
   ones and their neighbours. Every frame shows legible content or an obvious continuation. Then, with a
   browser, exercise the mechanism: empty, extreme and invalid input, back, reload, a shared URL, keyboard
   only, 200% zoom, reduced motion, and the motion moment at normal speed. Without a browser, list these
   as not checked.
2. **Passes.** Answer each question with the frame that shows it; a "no" is a finding.
   - *Conversion*: does the first phone frame say who it is for, what they get and what to do? Is the
     first value reached without scrolling past it? Are price, delivery and the next step in one frame?
     Does each objection of the decision path appear in the frame where the visitor decides?
   - *Research fidelity*: for each row of the Axes table, name a frame below the first screen where the
     chosen position is visible. For each spark used, name its frame.
   - *Coherence*: which frame could belong to another site? Which one falls back to plain text on a plain
     field when the concept says otherwise?
   - *Specificity*: in which section would a competitor's product fit unchanged?
   - *Detail*: the failure modes below, in every frame and state.
3. **Findings.** At most five, ranked by buyer impact, each with frame, cause and the quality to keep.
   Fix causes, recompile with `--release`, read the changed frames and their neighbours. Repeat until no
   finding is above detail level, usually one or two rounds. With a second agent available, let it review
   without your build context: it reads the research, concept.md and the frames, and nothing else.
4. **Ceiling.** Pick the weakest frame and the signature moment. For each, make one concrete change that
   adds substance, not decoration: real data where text describes it, a state that answers the visitor,
   an image doing a job the concept gives it, or a cut that lets the strongest element breathe. Then a
   final full review.

Without Chrome, ask the user for phone and desktop screenshots of the whole page, and report the visual
review as not done rather than passed.

Keep your own review state (screenshots, logs, scripts, browser checks) in `qa/` at the project root.
The project's .gitignore excludes it; research/ holds only the two research files.

The page is done when `lfm compile --release` reports 0 errors and 0 warnings, the review left nothing
above detail level, and the report's `Next` line says deploy.

## Detail failure modes

These ship on pages that looked finished in chosen screenshots; check each in the frames.

| Failure | Countermeasure |
| --- | --- |
| Empty or half-faded frames in scroll scenes | Each item's legible span exceeds the distance to the next; fade whole units; keep a continuation cue in pinned parts |
| Label above every heading | Keep one only when it adds what the heading lacks: time, step, price, status |
| Decoration cut at a section edge | Keep it inside its section or fade it before the clipping edge |
| Numbers and units split across lines | Render values as one unbreakable token; test the longest value at 320–390 px |
| Positioned labels clipped on phones | Place per breakpoint or let them flow |
| Empty default state dominates | Show a labelled example the visitor overwrites |
| Pinned object covers text on phones | Give phones a reading zone it never overlaps |
| Long uniform stretch | Fold secondary detail into disclosures; vary each screen's composition |
| One rich asset beside rough secondary art | Raise the secondary art or present it typographically |
| Orphans in short text | `text-wrap: balance` for four lines or fewer; tighten the copy first |
| Result off screen after input on phones | Put the answer beside the input, or bring it into view when it changes |

## Gotchas

- `lfm serve --open` recompiles on save; the preview is the compiled output, not the template.
- Every rendered link except a same-page `#fragment` is a named `urls` entry in `lfm.json`.
- Set fonts through tokens (`font-family: var(--body)`); the compiler follows them to the concept's faces.
- A variable font's `@font-face` declares the axis range the file has (`font-stretch: 75% 125%`).
- Values that change with input use tabular numerals and units in the same element.
- A warning you cannot fix without breaking the concept means the concept needs a change; edit
  concept.md first, then the page.

After deployment, `lfm check <url> --json` checks the published page with the same page rules.

Pair a built target with `lfm check <url> --project <dir> --json` to include project-only rules.
Use `lfm check --project <dir> --json` to check output/ against current source without publishing.
Release checks require installed Chrome and Lighthouse plus loopback sockets. Timing findings
use up to three measurements; review informational diagnostics and third-party rows separately.
Page grounds must be white, cool or neutral grey, dark, or saturated subject colours. Warm off-whites and paper, parchment or notebook decoration fail `design.ground`; `data-design-reason` does not exempt it.
