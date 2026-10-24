---
name: lfm-book
description: Researches, plans, writes and ships an ebook as the deliverable of an lfm project - deliverables/book/concept.md cited to research, chapters written one at a time against it, the EPUB and PDF that lfm compile builds behind a download page buyers reach after paying, and the store packages for Amazon KDP, Apple, Google, Kobo, tolino, Etsy and more, paperback included. Use when the product sold is a book, guide, playbook or handbook, when asked to outline, write, finish or improve an ebook, to deliver a digital book after a Stripe payment, or to publish it in stores. Not for the sales page itself; research, design and implementation of the page have their own skills.
license: MIT
compatibility: Needs lfm and the project's research files; Chrome or Chromium for the PDF. Uses web search, a browser and image generation when available, and asks the owner for what it cannot source.
metadata:
  lfm-version: "0.1.8"
  lfm-sha256: "fbc70a5fa34eda653db35e7c65d69f4b20bbb36f35001a116ee03c4cbf5d257d"
---

# Write and ship a book with lfm

A book a model writes from its own knowledge is the average of every book on the topic. This one starts
from what readers actually wrote, is planned in one lean file, and is written one chapter at a time with
the whole plan in view. `lfm compile` checks the plan, every chapter and the finished files, and publishes
them at an unlisted address that only paying buyers receive. The same compile prepares every store in
`distribution/book/`: the book's files once, and per store a guide naming its uploads and fields.

## Rules that always hold

1. **The concept is the brief.** Every chapter serves the promise and its row's job. When a decision
   changes, change deliverables/book/concept.md first, with a Changelog line, then the chapters.
2. **Real or nothing.** Every case, number, study, quote and name is true and traceable to the research,
   the owner or a source you opened, linked where the reader can check it. A missing fact becomes an
   `Open:` line for the owner, never a plausible guess. Research voices shape the book; quote a person
   only with their permission.
3. **One piece at a time, the whole in mind.** Before each chapter, reread Reader, Promise, Big idea,
   Voice and Devices, the chapter's row, the end of the previous chapter and the next row.
4. **0 errors, 0 warnings.** Fix a `book.copy` finding by rewriting around the concrete thing it stands
   for, never by swapping in a synonym.
5. **Never invent what the owner decides:** price, delivery date, author name, ISBN, legal text, and
   whether to sell exclusively on Amazon.
6. **Declare AI use truthfully.** Stores call text AI-generated when an AI tool wrote it, even if a person
   edited it afterwards; assisted means a person wrote it and AI helped to edit or check. If you drafted
   the chapters, the text is generated. Several stores refuse generated books; lfm then leaves them out.

## Before you start

- `lfm compile` must show a `research` line without `research.*` findings. Add one ongoing batch for the
  book with `lfm skills research`, trigger "book": the questions readers ask, what they tried and why it
  failed, the words they use; and as peers at least 3 books, guides or courses they weigh
  instead: Opening is a peer's promise and first page, Palette, Type and Imagery its cover, Motion `none`,
  Mechanism its contents and length, Proof its reviews, Price its editions, Tone its voice, Takeaway what
  reviews praise and complain about.
- Create `deliverables/book/` and add to `lfm.json`:
  `"deliverables": {"book": {"author": "…", "path": "…", "offer": "…"}}`, and the publisher as
  `"seller": {"name": "…", "imprint": "…"}`. The compile error for a missing entry prints a fresh path of at
  least 16 characters: the only lock on the files. `lfm help config deliverables.book` lists
  every option with its default.
- The Next line reaches the book once the page's phases are clean; start earlier when the owner asks.

## Phase 1: the concept

Write deliverables/book/concept.md in exactly this format; the words are yours, cite research IDs throughout:

```markdown
# Book: <working name>
## Reader
<who they are, where they are stuck, what they tried> V001 V014
Not for: <who this book is not for>
## Promise
<After this book the reader can …: one sentence> V003
Won't cover: <what the book leaves out>
Before: <what the reader does or has now, observable> V004
After: <what they do or have after the book, observable> V006
## Big idea
<what the competing books all do, and the one framing this book uses instead> P002 P005
## Objections
- "<a doubt in the reader's words>" V012 → 3
## Hooks
- Title: "<title>"
- Subtitle: "<the promise in the readers' words>"
- Opening: <the first page: a scene, question or claim from a voice> V008
- <a line worth quoting, a counterintuitive claim>
## Voice
- Use: "<the readers' own phrase>" V011
- Avoid: "<word the book never says>"
- <person and address, rhythm, humor, how it treats the reader> V005
## Devices
- <a recurring touch: a running case, a checklist, a worked example, a ritual from the research> V019
## Cases (optional)
- <name>: <who they are, their starting point and stakes>; <real, with source or permission | composite>
## Chapters
| # | Title | Job | Beats | Words | File |
| --- | --- | --- | --- | --- | --- |
| 1 | <title> | <what the reader can decide, diagnose, build or avoid after it> | <hook, idea, proof, how-to, bridge> V002 | 2500 | [01-name](chapters/01-name.md) |
## Imagery
| Image | Chapter | Job | Art direction | File |
| --- | --- | --- | --- | --- |
| Cover | cover | cover | <what the cover shows, readable at thumbnail size> | [cover](images/cover.jpg) |
## Look
Trim: <5x8in | 5.5x8.5in | 6x9in | A5 | A4 | letter>
Body: <family>, <fallback families>, <generic family>
Headings: <family>, <fallback families>, <generic family>
Accent: <#rrggbb>
<cover idea, interior details>
## Qualities
## Changelog
```

Work through it in order:

1. **Reader and Promise** from the voices: one reader, one promise with an outcome they can check, the
   scope fences (`Not for:`, `Won't cover:`) that keep the promise keepable, and the change as `Before:`
   and `After:` in terms someone could observe. The chapters' jobs add up to the After.
2. **Big idea** from the peers: name what they all do, then the framing this book takes instead.
3. **Objections**: at least 3 doubts readers voice in the research ("I tried that",
   "no time", "mine is different"), each with its voice and `→ <chapter>` that answers it.
4. **Hooks**: title, a subtitle that carries the promise, the opening page, two or three quotable lines.
5. **Voice** with exact `Use:` and `Avoid:` phrases; `lfm compile` holds the chapters to them.
6. **Cases**: the people or projects the book follows, ideally one running case that moves from Before to
   After across the chapters. Real ones with their source or permission; invented ones marked composite.
7. **Chapters**: at least 3, each with one job and an observable verb. Two chapters
   with the same job merge. Beats name their kind: the opening scene (who, where, when, what went
   wrong), the proof (a named source), the worked example (real numbers), the pitfall, the limit, the
   artifact a reader would screenshot, the bridge. Let each chapter's material choose its shape: one long
   case, a before and after, a decision path, a single annotated example; neighbours differ. Word targets
   from 300 to 20000; chapters must land within 35% of them.
8. **Imagery**: a cover and only images with a job (a diagram that explains, a photo that proves), art
   direction from what readers photograph. Cells that wait for the owner say `Open:`.
9. **Look**: trim, typefaces you can embed, one accent color.

Then reread it as the writer of chapter 4 would. Could each chapter be written from its row alone? Does
any job repeat? Would the promise still hold with a competitor's name on the cover? Is anything planned
that no source supports? Run `lfm compile` and fix every `book.concept` and `book.evidence` finding;
`book.open` stays until the owner answers.

## Phase 2: one chapter at a time

The Next line names the chapter to write. For it:

1. Reread as rule 3 says. In your notes (your reasoning or a scratch file outside the project), write the
   obvious version first: the paragraph and outline any writer would produce from this row. Then plan
   what only this book's research can give: five beats, the case, the proof, the numbers.
2. Write `deliverables/book/chapters/<file>.md` in Markdown: `# <the planned title>`, `##` sections, lists
   only for real steps or enumerations. Images as `![what it shows](../images/name.jpg)`, other chapters
   as `[text](02-name.md)`, sources as `https` links.
3. Run `lfm compile` and fix every `book.chapter`, `book.copy` and `book.value` finding in this chapter.
   A `book.machine` finding names the passage that reads most generated: rewrite it once per chapter from
   the research material, in the readers' words, keeping key terms and letting sentence length follow the
   thought. Then move on, even if a flag remains; the whole-book pass and the owner's read take it up.
4. Review it with the checklist below, then the next chapter. If the chapter changed a decision, update
   the concept and its Changelog first.

How a chapter earns its place:

- **Open inside a moment.** A person, a place, a time and what went wrong or surprised them, in the first
  two sentences; or one surprising number with its source. The reader feels the problem in 150 words.
- **The story is the argument.** Every case shows the chapter's point as cause and effect, or it goes:
  one case per point, and detail that carries nothing lowers what readers learn.
- **Climb down and up.** After each general claim, the concrete instance within two sentences: a name, a
  number, an object, the words someone said. After each case, one sentence on what it means.
- **Something to use early and often.** The first step, amount or decision within the first few hundred
  words, one worked example with real numbers, and the place where beginners typically go wrong.
- **One proof a reader can check**, linked next to the claim it supports, with what it does not show. A
  reader's story links its post, or is told as the author's own or marked as a composite. Safety and
  health rules rest on the strongest source the research has; a reader's report illustrates, never
  proves. Pair each case with its limit: when it does not apply. Quote a source in one sentence at most,
  in quotation marks and attributed; otherwise paraphrase and link. When a planned source cannot be
  opened, use another the research has, or mark the beat `Open:` in the concept.
- **One rule per decision.** Every number, time and threshold agrees with the chapter, earlier chapters
  and the sales page; where two seem to conflict, say which applies when.
- **Say it once.** Each instruction lives in one place, later sections point to it; a point that returns
  adds a layer. Then cut every sentence that restates.
- **Write as an equal pointing at something.** Show the thing and let its importance be obvious; quotes
  sound like the person who said them.
- **End when the job is done:** on the last useful move, or on the open question the next chapter answers.
  The bridge sentence comes first; a recurring end device (a checklist, "tonight") follows and holds the
  one or two next actions, pointing to the steps above instead of repeating them.

Before moving on, answer in your notes: the chapter's job in one sentence and where it is done; the
first thing a reader can use and its word position; the proof and its limit; which story could go
without loss (cut it); what a reader of three blog posts on the topic learns here; and whether the first
sentences of all paragraphs, read in order, tell the chapter's argument; and whether any number or rule
contradicts another. If the chapter falls short of its target, lower the target instead of padding.

## Phase 3: the whole book

Once every chapter exists, read the book in one pass with fresh eyes, as its harshest readers would:

- **The sample**: stores show the first tenth. Does it deliver something real, the promise believable?
- **The promise ledger**: every chapter serves the promise and moves the case towards After; every
  objection is answered where the concept says.
- **Three one-star reviews**, written in your notes before fixing anything: the reader who has read the
  blog posts, the expert in the field, the skeptic of the promise. Fix what each would quote.
- **The five-star line**: the sentence a happy reader quotes when recommending the book. If there is
  none, the book lacks its core; sharpen the chapter that should carry it.
- **The owner's read**: ask the owner to read the first, a middle and the last chapter. Taste and voice
  are theirs to judge.

## Phase 4: cover, images and the finished files

- The cover is at least 1600×2560 pixels, 1:1.6, with a title readable at
  thumbnail size. Generate or render it, or ask the owner; never use stock. The paperback prints the
  front at the trim's ratio and 300 dpi: when `book.channels` asks, add `deliverables/book/images/cover-print.jpg`,
  the same design composed for the trim at the size the finding names.
- Typefaces: WOFF2 files licensed for embedding (OFL works) under `deliverables/book/fonts/`, with
  `@font-face` rules in `deliverables/book/book.css`. That file may refine lfm's book styles.
- Once every chapter exists, `lfm compile` builds the EPUB into `output/<path>/` beside the download
  page; `lfm compile --release` prints the PDF and paperback with Chrome, which later compiles reuse while
  the book is unchanged, and checks the layout at phone width and in print.
- Open the PDF and look at every page: cover, title page, contents, each chapter opening, every image
  and table, the page breaks. Open the EPUB in a reader when you can. Fix what you see in the chapter
  or `book.css`, compile again.

## Phase 5: delivery

- `sell` in `lfm.json`: `page` (default) publishes a download page at `path`, never linked from the page
  (`book.delivery`): Stripe redirects there, the invoice footer carries it. `shops`: the stores deliver and
  the page's offer links to the live listing. `bundle`: sold only inside `deliverables.bundle` with the project's other deliverables.
- EU buyers of digital content consent to immediate delivery and the end of their withdrawal right: the
  page concept's Offer carries that wording as an `Open:` line until the owner gives it.
- Presale: until every chapter exists the download page says the copy is being written; then the owner
  emails buyers the address. A new edition is a new compile at the same address.

## Phase 6: the stores

Once every chapter exists, write deliverables/book/listing.md, the texts every store asks for, in exactly this format:

```markdown
# Listing: <the title from Hooks>
## Description
<Markdown: who it is for, what they can do after it, what is inside; bold, lists and ### headings only>
## Short description
<one or two sentences, up to 300 characters>
## Back cover
<the paperback's back: a few short paragraphs, up to 1200 characters>
## Author
<two to four sentences from the owner's facts>
## Keywords
- <a phrase readers search, not already in the title>
## Tags
- <up to 20 characters>
## Categories
- BISAC: <code> <label>
- Thema: <code> <label>
- KDP: <category path>
## Prices
- Ebook: <amount> EUR, <amount> USD
- Paperback: <amount> EUR
## AI
Text: <none | assisted | generated>
Images: <none | assisted | generated>
Tools: <the AI tools used>
Statement: <one sentence in the book's language for the copyright page: what AI did, with which tools>
```

- The description sells the promise in the readers' words from the research; 200 to
  4000 characters, no links, prices, rankings or review requests. Up to
  7 keywords and 13 tags, each tag at most 20 characters.
- Categories: look the codes up in the BISAC and Thema lists, one to three each; KDP paths as KDP shows them.
- Prices come from the owner (`- Open: prices` until then). The ebook stays at least 20% below the
  paperback for KDP's 70% royalty; a German book has one price everywhere, the page included.
- Run `lfm compile` until `book.listing` and `book.channels` are clean. `distribution/book/` then
  holds the EPUB, PDF, cover and paperback files once, and `stores/<channel>.md` per channel
  (kdp, apple, google, kobo, tolino, barnes-noble, draft2digital, ingramspark, lulu, etsy, gumroad, payhip): the files to upload and every field in its format, ready to paste. `README.md`
  there lists what is ready and what the owner decides. Look at the paperback files as at the PDF.
- Hand the owner the README: accounts, tax, ISBNs, exclusivity, proofs and uploads are theirs; with a
  browser and their permission you may fill a store's forms from its guide, uploading the files it names.
