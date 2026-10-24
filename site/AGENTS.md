# Codex

An lfm project: one sales page, compiled by the `lfm` CLI into `output/`.

## Start here

Run `lfm skills install` once. It puts the research, design, implementation, book, printable, spreadsheet, document and deck skills where your
agent loads them (`.agents/skills`, or `.claude/skills` under Claude Code); run it again after
updating lfm. Without installed skills, `lfm skills <topic>` prints the one you need.

Then run `lfm compile`. Its last line names the next step (research, design, implementation, fix,
review or deploy) and the skill that covers it. Follow that line until it says deploy.

## Commands

- `lfm compile` checks and builds. Fix every error and warning it prints; each one says how.
  `--json` prints the same result, the findings and the next step as JSON.
- `lfm compile --release` also measures the page in headless Chrome, and with Lighthouse when installed.
- `lfm serve --open` previews the page and recompiles on every save.
- `lfm rules` lists every check; `lfm rules <id>` explains one.
- `lfm skills` lists the skills; `lfm skills <topic>` prints one; `lfm skills install` installs all.

## Layout

| Path | Holds |
| --- | --- |
| `lfm.json` | Page facts: url, language, title, description, social image, named urls, data |
| `index.html.tmpl` | The page, in Go `html/template` syntax; optional `partials/` |
| `assets/` | Styles, scripts, images and fonts referenced from the template |
| `public/` | Optional fixed-URL files copied unchanged into output; robots.txt and sitemap.xml override generation |
| `data/` | Optional JSON files, available as `.data.<file name>` |
| `research/` | `human-voices.md` and `competitor-analysis.md`: real sources, verbatim |
| `concept.md` | The design decisions, written by the design skill and cited to research |
| `deliverables/book/` | Optional: a book the page sells, planned in its `concept.md`, chapters in `chapters/`, store texts in `listing.md` |
| `deliverables/printable/` | Optional: a printable the page sells (planner, game, puzzle pack), planned in its `concept.md`, pages in `printable.html.tmpl` |
| `deliverables/spreadsheet/` | Optional: a spreadsheet template the page sells, planned in its `concept.md`, sheets in `workbook.json` |
| `deliverables/document/` | Optional: editable documents the page sells (letters, invoices, minutes), planned in its `concept.md`, one Markdown file per document and language |
| `deliverables/deck/` | Optional: slide decks the page sells (training briefings, workshops, quiz games), planned in its `concept.md`, one Markdown file per deck and language |
| `deliverables/bundle/` | Optional: `listing.md` of two or more deliverables sold together |
| `distribution/` | Store packages per unit (`book/`, `printable/`, `spreadsheet/`, `document/`, `deck/`, `bundle/`), written by `lfm compile`. Never edit or deploy it |
| `output/` | The compiled page. Never edit it; deploy it as is |

## Working rules

Every page goes through three phases, each with its own skill:

1. **research**: real buyer voices and competitor pages into `research/`, verbatim and dated.
2. **design**: `concept.md` from the research, the only brief for the page; every decision cites research.
3. **implementation**: the page from `concept.md`, iterated until it compiles clean and every frame of
   `lfm compile --release` holds up on phone and desktop.

- Never skip a phase: a page built without research and a concept is the typical generated page.
- A book the page sells is written with the book skill (`lfm skills book`): its own concept, then one
  chapter at a time; `lfm compile` builds it and publishes it behind an unlisted download page.
- A printable the page sells is built with the printable skill (`lfm skills printable`): one template of
  fixed-size pages, rendered for every paper size and variant.
- A spreadsheet the page sells is built with the spreadsheet skill (`lfm skills spreadsheet`): one
  `workbook.json`, built as Excel files per language and currency, every formula computed and checked.
- Editable documents the page sells are written with the document skill (`lfm skills document`): one
  Markdown file per document and language, styled by the concept's theme, built as .docx per paper.
- Slide decks the page sells are written with the deck skill (`lfm skills deck`): one Markdown file per
  deck and language with speaker notes, built as .pptx with a notes PDF and quiz sheet. Each deliverable sells through the page,
  through shops, or both together as a bundle (`sell` in `lfm.json`).
- New customer signals go into research first, then into `concept.md` with a changelog entry, then the page.
- Reference local files from the template; `{{style "…"}}` and `{{script "…"}}` bundle CSS and JS.
- Keep product facts in `lfm.json` under `data`, not hardcoded in markup. `lfm help config [field]` explains
  every field lfm.json takes; config findings quote the field they are about.
- The page must compile with 0 errors and 0 warnings. Silence a design check only with
  `data-design-reason="…"` naming the real reason.
