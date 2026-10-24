---
name: lfm-printable
description: Plans, builds and ships a printable as the deliverable of an lfm project - planners, trackers, party games, escape rooms, bingo, puzzle packs and worksheets written as one HTML template of fixed-size pages, rendered for every paper size and variant, checked page by page, printed to PDFs behind a download page buyers reach after paying, with listing images and store guides for Etsy, Gumroad, Payhip and Ko-fi. Use when the product sold is a printable or a PDF for note apps, when asked to design, build, fix or extend one, or to list it in a shop. Not for the sales page itself, nor for ebooks; those have their own skills.
license: MIT
compatibility: Needs lfm; Chrome or Chromium for the PDFs and listing images. Uses web search and a browser when available, and asks the owner for what it cannot source.
metadata:
  lfm-version: "0.1.9"
  lfm-sha256: "849065054e16b2aac8af36efa2b6fff627072285f3310638a27224442a4b7684"
---

# Build and ship a printable with lfm

Buyers of printables judge two things: does it work the moment it prints or opens, and is it more
complete than the ten listings beside it. Broken links, missing answer keys, wrong paper sizes and
clipped edges are what one-star reviews name. lfm renders the product from one template for every size
and variant, checks every page, and builds what each shop needs, so the work goes into the content.

## Rules that always hold

1. **The concept is the brief.** deliverables/printable/concept.md plans every part and its page count; the
   compiler holds the pages to it. When the product changes, change the concept first, with a Changelog line.
2. **Compute, never type.** Dates come from `calendar`, puzzles from the generators below, page numbers
   from `.page-number` and `.page-ref`; answer keys render from the same data as the puzzles.
3. **Every page is one `<section class="page">`** with `data-part` naming its Contents row. Nothing
   outside a page prints.
4. **Own or licensed only.** Your own art, OFL or Google fonts in `deliverables/printable/fonts/` (or a
   generic stack such as `sans-serif`; system fonts may not be redistributed), no
   characters, brands or franchise names (no "Harry Potter", "Disney", "Tabu"; describe the game instead).
5. **Promise only what the files hold.** Page counts, sizes and link counts in the listing come from
   the build; lfm writes them into every store guide.
6. **Ask the owner** for the price, the shop name and anything only they can decide; never invent reviews,
   sales counts or testimonials.

## Before you start

- The page's research (`lfm skills research`) holds the buyers' words; read what they complain about in
  competing printables before planning. Search Etsy for the product and open the top five listings: what
  they include, their sizes, their photos, their visible reviews.
- Create `deliverables/printable/` and add to `lfm.json`:
  `"deliverables": {"printable": {"path": "<at least 16 random lowercase letters and digits>", "version": "2027.1"}}`
  and the shop's name as `"seller": {"name": "…"}`. The path is the only lock on the files; `lfm compile`
  prints a fresh one when it is missing. `lfm help config deliverables.printable` lists every option.

```text
deliverables/printable/
  concept.md               the plan
  printable.html.tmpl      every page, for one edition
  printable.css            the look; lfm sets page size, safe margin and fonts
  data/*.json              word lists, items, questions: .Data.<name>
  images/  fonts/          own art; WOFF2 files with @font-face in printable.css
  listing.md               store texts
```

## Phase 1: the concept

Write deliverables/printable/concept.md in exactly this format:

```markdown
# Printable: <product name>
## Buyer
<who prints or opens this, when, and why now>
- Not for: <who it does not serve>
## Promise
<one sentence: what they can do, plan or play with it>
## Contents
| Part | Pages | Job |
| --- | --- | --- |
| Cover | 1 | shows the product and what is inside |
| Guide | 1 | how to print or import, the licence |
| <part> | <exact pages> | <what the buyer does with these pages> |
## Editions
- Sizes: a4, letter
- Ink: color, ink-saver
## Look
Body: <font stack>
Headings: <font stack>
Accent: #rrggbb
## Changelog
```

- Sizes: a4, a5, half-letter, letter, tablet. Ship A4 and Letter for paper: Europe prints A4, North America Letter.
  `tablet` is the 3:4 page of e-ink tablets and large iPads, for linked planners.
- Every other Editions line is a variant: `Ink: color, ink-saver`, `Start: monday, sunday`, `Age: 6-9, 10+`.
  Each size times each variant is one PDF; variants of one size hold the same pages.

What the best sellers include, by kind:

- **Planner or tracker:** cover, a start-here guide, an index, year, 12 months, weeks, trackers, notes
  pages; dated plus undated; Monday and Sunday start (German: Monday, ISO week numbers). Linked editions
  carry month tabs and a home link on every page, a back link from day to week to month to year.
- **Escape room or mystery game:** a quick-details block on the cover (ages, players, time, setup
  minutes, what you need), story letter, a start card, 8 to 12 puzzles of at least five kinds, one final
  puzzle combining earlier answers, an offline way to check answers, three-level hint cards, a host guide
  with setup and solutions, invitations and a certificate. At most four pages to cut.
- **Party game bundle:** the exact game count, each game full page and as 2-up cards, an answer key for
  every game with answers, a "play this game" sign per game. German bundles use German classics.
- **Bingo:** numbered unique cards (30 to 50 themed), calling cards, a rules page; print the host tip
  from `.FirstWin`. **Puzzle pack:** three difficulties, one puzzle per page, solutions at the back,
  a large-print variant for seniors.
- **Every product:** cover first, a guide page (print at 100% actual size, which pages want colour or
  card, the licence for personal use), contents with page numbers, keys at the back, a footer with
  product name and page number.

Run `lfm compile` and fix every `printable.concept` finding.

## Phase 2: the pages

Write `deliverables/printable/printable.html.tmpl` (Go templates). It renders one edition; lfm runs it for
every edition and wraps it in the page CSS. What it sees:

- `.Name`, `.Promise`, `.Parts` (`.Name`, `.Pages`, `.Job`), `.Shop`, `.Version`, `.Language`, `.Data.<file>`.
- `.Edition.Size` (`.Key` such as a4, `.Label`, `.Width` and `.Height` in mm, `.Digital`),
  `.Edition.Is "ink-saver"`, `.Edition.Option "Start"`. The `<html>` element carries the size key and
  variant values as classes: style `.ink-saver h1 { color: <ink colour> }`, hide with `.tablet .paper-only`.
- `calendar "2027" "monday"` or `calendar "2026-08" "sunday" 12` (months, default 12):
  - `.Weekdays`: the seven `.Name` and `.Short` from the start day.
  - `.Months`: `.ID` (m2027-01), `.Num`, `.Year`, `.Name`, `.Short`, `.Days`, and `.Rows`: the weeks of
    the month grid, each with `.Days` including neighbouring months' days (`.InRange` false).
  - `.Weeks`: every week, `.ID` (w2027-05), `.Number` (ISO week, KW), `.Days`.
  - `.Days`: `.ID` (d2027-01-05), `.Day`, `.Month`, `.Year`, `.Weekday.Short`, `.Week` (its week's ID),
    `.IsoDate`. Link a day cell with `href="#{{.ID}}"` when that page exists.
- `bingo .Data.items 40 5 true 7` (cards, size, free centre, seed): `.Cards` (`.N`, `.Cells` as rows; the
  free centre is ""), `.Calls` (every item, for calling cards), `.FirstWin` (median calls until the first
  bingo with every card in play: "expect the first bingo around call 14").
- `wordsearch .Data.words 14 "medium" 3` (size; easy is right and down, medium adds diagonals, hard
  every direction; seed): `.Grid` rows of letters, `.Words`, and `.Hit $row $col` for the key's marks.
  German umlauts are spelled AE, OE, UE, as puzzle books do.
- `sudoku "easy" 11`: `.Puzzle` and `.Solution`, 9 rows of 9 numbers, 0 for a blank.
- `maze 14 18 5` (columns, rows, seed): `.SVG 10 false` draws it, entrance top left, exit bottom right;
  `.SVG 10 true` adds the path with class `solution` for the key. Style both with CSS.
- `seq 12` (1 to 12), `chunk .Cards 4` (groups of any list, e.g. cards per page), `add`, `sub`, `mul`,
  `mod`, and `dict "a" 1 "b" 2` to pass several values to a `{{template}}`. A loop over a number runs
  at most 10000 rounds and arithmetic stays within ±100000; nest loops over lists, not numbers.
- A seed fixes a puzzle; change it for a new one. Every generator checks its result and fails the
  build rather than print an unsolvable puzzle.

Page rules:

- `<section class="page" data-part="<Contents part>" data-role="<role>" id="<link target>">`. Roles:
  cover, guide, contents, puzzle, key, cut, certificate, extra. The first page is the cover; a guide page is required; puzzles need a key.
- Page numbers: `<span class="page-number"></span>`, `<span class="page-count"></span>`, and
  `<span class="page-ref" data-ref="<id>"></span>` for the page an id is on. Links are `href="#<id>"`.
- lfm sizes every `.page` to the paper (`var(--page-width)`, `var(--page-height)`), with
  `box-sizing: border-box`, `overflow: hidden`, `position: relative` and padding of the 6.35
  mm safe margin printers cut or skip (`var(--safe)`); `display` is yours. Keep text, pictures and
  borders inside the padding: frames on an inner element, line-height of headings at least 1.2. A
  full-bleed background element gets `data-bleed`. Sizes in mm: A4 210×297, Letter 215.9×279.4, A5
  148×210, half-letter 139.7×215.9, tablet 157.5×210: tablet pages hold less, so reduce, not shrink.
- Draw writing lines, dot grids and checkboxes as SVG or real borders, never CSS gradients: gradients
  print with uneven spacing.
- Body text at least 10 pt for paper, 12 pt on tablets; lines at least 0.5 pt and 35% grey so they
  print. Ink-saver editions drop flood fills and decorative tints.
- Images in `deliverables/printable/images/` at 300 dpi for their printed size; your own work only. Simple
  art works well as inline SVG.
- Pages buyers cut out (cards, signs, tags) carry `data-role="cut"`; keep them few (two for kids'
  products, four for adults) and draw dashed cut lines.

Then `lfm compile` and fix every `printable.pages` and `printable.build` finding. It renders every
edition in milliseconds: page counts against Contents, roles, every link and image. `lfm serve` shows
each edition as HTML at `/<path>/preview/<edition>.html` (for example `a4-color`), reloading on save.

## Phase 3: print and look

`lfm compile --release` prints every edition with Chrome, checks each page against the safe margin and
the PDF's page count against the rendered pages, and renders the listing images. Later compiles reuse
the prints while the product is unchanged. Open every PDF and look at every page in every size: clipped
text, crowded cards, a grid too small to write in, a key that does not match its puzzle. Solve one
puzzle of each kind yourself; for an escape room, ask the owner for one blind playtest before launch.

## Phase 4: the listing

Write deliverables/printable/listing.md in exactly this format:

```markdown
# Listing: <product name>
## Title
<what it is, for whom, the formats; the words buyers search first; up to 140 characters>
## Description
<what is included, sizes, how it works, what buyers need, that nothing is shipped, the licence>
## Tags
- <up to 13 phrases buyers type, each at most 20 characters>
## Price
<12.00 EUR, the same as the page's offer>
## AI
Text: <none | assisted | generated>
Images: <none | assisted | generated>
Tools: <the AI tools used>
Statement: <one sentence stores show about the AI use>
```

- The description opens with the buyer's situation in their words, then the contents as a list. Keep
  claims to what the files hold; lfm appends the build facts. No links, no "best", no other shops.
- The Contents Job texts caption the listing images; write them for buyers.
- Run `lfm compile` until `printable.listing` and `printable.channels` are clean.

## Phase 5: delivery and shops

- `sell` decides how buyers get the files: `page` (default) publishes the download page the report prints;
  never link it from the page (`printable.delivery`); Stripe's Payment Link redirects there. `shops`: the
  shops deliver, and once a listing is live the page's offer links to it. `bundle`: only together with other
  deliverables, in `deliverables.bundle` with its own deliverables/bundle/listing.md in the Phase 4 format. Its
  download page and shop packages hold every file of each. `lfm help config deliverables.bundle` lists its options.
- `distribution/printable/` holds every PDF and listing image once, `README.md`, and per channel
  (etsy, gumroad, payhip, ko-fi) a guide in `stores/` naming the files and images to upload, in order, and
  every field ready to paste. Etsy takes 5 files; lfm zips by paper size when the
  PDFs do not fit. Only a release prints the PDFs and images into it; ordinary compiles reuse them.
- Look at every listing image. The first is the cover alone; Etsy ranks it higher without text.
- Hand the owner the README: accounts, prices, tax and uploads are theirs; with a browser and their
  permission you may fill a shop's form from its guide.
- A seasonal product sells from six to eight weeks before its date; a German edition of a proven product
  is a separate listing at a German price.
