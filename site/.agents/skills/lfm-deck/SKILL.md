---
name: lfm-deck
description: Plans, writes and ships slide decks as the deliverable of an lfm project - training briefings a business must hold every year, workshops and courses a trainer runs, quiz games with their questions written, any deck a buyer presents from PowerPoint, Keynote or Google Slides and pays for what it says. One Markdown file per deck and language, compiled with a theme into .pptx files with a slide master, six layouts and speaker notes, every slide's text measured against its box on each compile, printed on a release as slides, speaker notes and a quiz sheet with its answer key, shipped as a ZIP per language with fonts, a start guide and listing images. Use when the product sold is a presentation, a training deck, a slide-based quiz or a set of them, or when asked to design, fix or list one. Not for the sales page, documents a buyer fills in, spreadsheets, printables or ebooks; those have their own skills.
license: MIT
compatibility: Needs lfm, and Chrome or Chromium for the release's prints, slide checks, start guides and listing images. LibreOffice, when installed, adds a second opinion. Fonts come from Google Fonts.
metadata:
  lfm-version: "0.1.8"
  lfm-sha256: "2636ea8b0dbe47ce97f48186ade9eb87e6b81f3fae0426209771199e5a1abe21"
---

# Build and ship slide decks with lfm

Generic business, pitch and report decks are free everywhere and replaced by AI deck tools; nobody pays
for a layout alone. Buyers pay for a deck that does a job they have to do: the content written, the
notes that let them present it tomorrow, the quiz that checks it landed. Their complaints about bought
decks: fonts that are missing, text boxes instead of real layouts, slides that break in Google Slides or
Keynote, a download that does not match the preview. lfm owns all of that; the content and the plan stay
yours.

## Rules that always hold

1. **The concept is the brief.** deliverables/deck/concept.md plans every deck; when the set changes, change the
   concept first, with a Changelog line.
2. **The notes are the product.** A presented deck carries speaker notes on every slide: what to say, what
   to ask, what to show. The slide holds what the audience must read, the notes everything else.
3. **Write what a real presenter has.** Real-sounding places, names and figures; mark what the buyer
   changes as `==Riverside Allotment Society==` so it is highlighted in every app.
4. **Facts with a source.** Training content cites the rules it rests on and their date; say it is no
   legal advice. Whether an expert reviews the facts before release is the owner's call.
5. **Name games generically.** Brand names of game shows get listings taken down.
6. **Ask the owner** for the price, the seller name and the Google Slides step; never invent reviews.

## What sells

- Training kits a business must run: yearly safety, hygiene and data protection briefings, onboarding.
  Buyers pay for correct, dated content, the notes and the quiz; German and other languages are thinly
  served, and translating slide for slide is lfm's strength.
- Course and workshop kits for trainers: the deck, the notes as a trainer's guide, the quiz.
- Quiz and party games with the questions written, themed and seasonal; blank game boards are crowded.
- Smaller corners: activity slides for care homes, church and youth group games.

Teachers Pay Teachers has announced a ban on AI-made resources; check a channel's rules before planning
for it.

## Before you start

- Read the page's research (`lfm skills research`) for the buyers' words and complaints, and look at
  what competing kits include and charge.
- Add `"deliverables": {"deck": {"path": "<at least 16 random lowercase letters and digits>",
  "version": "2027.1"}}` and `"seller": {"name": "…"}` to `lfm.json`. `lfm help config deliverables.deck`
  lists every option; notes print on US Letter and A4 for `en`, A4 elsewhere.

## Phase 1: the concept

```markdown
# Decks: <product name>
## Buyer
<who presents these, to whom, when, from which app>
- Not for: <who it does not serve>
## Promise
<one sentence: what they have done once they presented it>
## Decks
| Deck | Job |
| --- | --- |
| <file name> | <what the buyer does with it> |
## Look
Text font: <family>
Heading font: <family, when headings take a second one>
Accent: <#rrggbb>
## Changelog
```

Take the faces and the accent from the product's own decisions: the page's concept.md Type and Palette
when the decks belong to the page's product. Look reads as it does for documents, so a deck and its
handouts match: Google Fonts families under the OFL, an accent with 4.5:1 on white, since the cover sets
the title in white on it.
Typesetting, where the set needs it: `Paragraphs:` spaced or indented (indent for running text read in
order, space for forms and short blocks that are scanned), `Tables:` booktabs, hairline or grid (grid when
cells are filled in by hand), `Headings:` bold or regular, `Heading color:` ink or accent, `Text size:`
<pt>, `Line height:` <times the text size>, `Heading scale:` <times the level below>, `Ornament:` <one
glyph for a section break>. What Look leaves out stays at lfm's base.

## Phase 2: fonts

Put the static TrueType files of every family Look names in deliverables/deck/fonts/, with the family's
`OFL.txt`. The Google Fonts API lists them: `curl -s "https://fonts.googleapis.com/css2?family=<Family>:ital,wght@0,400;0,700;1,400;1,700"`
(spaces in the family as `+`) prints one `.ttf` link per face; download each as `<Family>-Regular.ttf`, `<Family>-Bold.ttf`,
`<Family>-Italic.ttf`, `<Family>-BoldItalic.ttf`. lfm embeds them in every .pptx (PowerPoint), Google Slides knows the
family by name, and the ZIP ships the files for Keynote users.

## Phase 3: the decks

One file per deck and language: `deliverables/deck/en/<deck>.md`, `deliverables/deck/de/<deck>.md`.

```markdown
---
title: Annual General Meeting
minutes: 20
---
# Annual meeting of ==Riverside Allotment Society==
==12 March 2026==

---
## The season in numbers

- 48 plots, 46 let
- Water use down by a fifth

::: notes
What the presenter says and asks on this slide.
:::
```

- Front matter: `title` (names the file), `minutes` (the speaking time; lfm then holds the notes to
  it), `slides` (the slide count it must have, when planned).
- `---` starts the next slide. The first `#` heading is the cover with an optional line below it; later
  `#` slides divide sections; `##` titles every other slide; `###` sets a subheading inside one.
- lfm picks the layout from the content: text and lists; `::: columns` with two columns separated by
  `+++`; one picture; one `> quote` as a statement; a table; a `> note` below text. A picture and columns
  take a slide of their own.
- A checklist with `- [x]` on the right answers and `- [ ]` on the others is a quiz question: the slide
  shows A, B, C; the notes and the quiz sheet's answer key carry the answer. A paragraph above the
  answers is the question; else the slide title is.
- `::: notes` holds the speaker notes for the slide it is on.
- `![what it shows](images/plan.png)` places a PNG or JPEG from deliverables/deck/images; at least 1920
  pixels wide for a full slide, with a description for screen readers.
- Quotes, dashes and ellipses become the language's typographic ones by themselves.

Run `lfm compile` after every change and fix every `deck.source`, `deck.fonts`, `deck.design` and
`deck.content` finding. lfm measures every line of every slide with the theme's fonts and names the slide
whose title wraps past two lines, whose text would not fit its box, that shows more than 60 words or seven
points, or lacks a title or notes. Translate decks slide for slide; lfm compares the slide counts of every
language. `lfm serve` shows every language at `/<path>/preview/<language>.html`, or `/deck/preview/` when
sold in shops: read every slide and its notes there.

## Phase 4: release

`lfm compile --release` prints every deck in Chrome laid out as its .pptx places each box: one page a
slide, the speaker notes beside each slide on paper, and the quiz sheet with its answer key on a page of
its own. `deck.layout` names a slide whose box cuts its text off, a print of other pages or size, or a
font the theme does not have; LibreOffice, when installed, opens the real .pptx too, and the report's
`optional` line names helpers that are not installed and what each would add, for the owner to decide.
The release ships each print in the language's ZIP, prints the start guide (open in PowerPoint, Google
Slides, Keynote and LibreOffice; present with the notes; adapt; licence) and renders the listing images
from the real slides, notes and quiz sheet. Open one .pptx in PowerPoint, Keynote or Google Slides
yourself and present a few slides.

## Phase 5: Google Slides, optional, the owner's step

Only the owner's Google account can make the masters: upload a .pptx to Google Drive, open it with Google
Slides, share it as anyone with the link, viewer, and add its address to `deliverables.deck.slides` as
`"en/briefing"`. The start guide and the download page then carry a copy link. Never edit a master after
selling.

## Phase 6: listing, delivery, shops

Write deliverables/deck/listing.md (Title, Description, Tags, Price, AI). The description opens with the job the
buyer has to do, lists the decks with their slides, minutes, notes and quiz, the apps, the languages and
that nothing is shipped. Run `lfm compile` until `deck.listing` and `deck.channels` are clean.

- Sold through the page (`sell: page`), the report prints the download address: one ZIP per language.
- Sold in shops (`sell: shops`), distribution/deck/ holds every ZIP, the images and a guide per shop
  with every field; link the live listing back to the page's offer.
- Sold with the project's documents as one kit (`sell: bundle`), `deliverables.bundle` lists both in its
  `units` and its own listing; `lfm help config deliverables.bundle` shows how.
- Hand the owner the README: accounts, prices, tax and uploads are theirs.
