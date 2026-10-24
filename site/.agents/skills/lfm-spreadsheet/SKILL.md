---
name: lfm-spreadsheet
description: Plans, builds and ships a spreadsheet template as the deliverable of an lfm project - budgets, bookkeeping, pricing calculators and trackers described in workbook.json, built as Excel files per language and currency, every formula computed and checked by lfm on each compile, with LibreOffice as an optional second opinion on a release, delivered with a Google Sheets copy link, a start-here PDF, listing images and guides for Etsy, Gumroad, Payhip and Ko-fi. Use when the product sold is a spreadsheet, template, calculator or tracker for Excel or Google Sheets, or when asked to design, fix or list one. Not for the sales page itself, nor for ebooks or printables; those have their own skills.
license: MIT
compatibility: Needs lfm; Chrome or Chromium for the start PDFs and listing images. LibreOffice, when installed, recalculates every file as a second opinion. The owner's Google account for the one Google Sheets step.
metadata:
  lfm-version: "0.1.8"
  lfm-sha256: "299425112ae879070fa436245762ae052e346734863c1921211e1b241742e013"
---

# Build and ship a spreadsheet template with lfm

Buyers keep a template that works the first evening and stays simple: one place to type, everything
else computed. The best sellers are a full system inside with a simple surface. One-star reviews name
broken formulas in another app, locked cells, dropdowns that refuse the buyer's own categories, a copy
link that does not open, and dashboards that need a 40-minute video. lfm builds the files from one
description and computes every formula itself, so the work goes into the
template's logic and words.

## Rules that always hold

1. **The concept is the brief.** deliverables/spreadsheet/concept.md plans every tab; the compiler holds the
   workbook to it. When the product changes, change the concept first, with a Changelog line.
2. **One list to type in, everything else computed.** Inputs are tinted, outputs plain, nothing locked.
3. **Portable formulas only:** ABS, AND, AVERAGE, AVERAGEIF, AVERAGEIFS, CHOOSE, CONCATENATE, COUNT, COUNTA, COUNTBLANK, COUNTIF, COUNTIFS, DATE, DAY, DAYS, EDATE, EOMONTH, FIND, FV, IF, IFERROR, IFNA, IFS, INDEX, INT, ISBLANK, ISERROR, ISNUMBER, ISOWEEKNUM, ISTEXT, LEFT, LEN, LOWER, MATCH, MAX, MAXIFS, MID, MIN, MINIFS, MOD, MONTH, NA, NOT, NPER, OR, PMT, POWER, REPT, RIGHT, ROUND, ROUNDDOWN, ROUNDUP, ROW, ROWS, SEARCH, SQRT, SUBSTITUTE, SUM, SUMIF, SUMIFS, SUMPRODUCT, TODAY, TRIM, UPPER, VLOOKUP, WEEKDAY, YEAR. No XLOOKUP, FILTER, LET, QUERY or TEXT:
   lfm refuses them because Excel, Google Sheets or LibreOffice compute them differently or not at all.
4. **Name things, never cells.** Formulas use placeholders, so a sheet renamed per language keeps
   working: `[log.amount]` is a table column, `[.amount]` this row's cell, `[income]` a named cell,
   `[@needs]` a word in the edition's language.
5. **Prove the numbers.** Every workbook has an example dataset and expected values; lfm computes them
   on every compile. Check the expected values by hand once: they are what buyers will see.
6. **Ask the owner** for the price, the seller name and the Google Sheets step; never invent reviews.

## Before you start

- Read the page's research (`lfm skills research`) for the buyers' words and what they complain about
  in competing templates. Search Etsy for the product; open the top listings, their tabs, photos, reviews.
- Create `deliverables/spreadsheet/` and add `"deliverables": {"spreadsheet": {"path": "<at least
  16 random lowercase letters and digits>", "version": "2027.1"}}` and `"seller":
  {"name": "…"}` to `lfm.json`. `lfm help config deliverables.spreadsheet` lists every option.

## Phase 1: the concept

```markdown
# Spreadsheet: <product name>
## Buyer
<who opens this, when, and what they want to know at a glance>
- Not for: <who it does not serve>
## Promise
<one sentence: what they see or decide with it>
## Tabs
| Tab | Job |
| --- | --- |
| <sheet key> | <what the buyer does or sees there> |
## Look
Accent: #rrggbb
## Changelog
```

What sells, by kind:

- **Budget:** start-here tab, settings (month, payday, savings goal), categories with monthly budgets,
  one transaction log (spending negative, income positive, as on a bank statement), a dashboard
  (income, spent, left, safe to spend per day until payday, budget per category, 50/30/20 shares) and
  a year view. Optional modules (debts, sinking funds, net worth) as hidden sheets.
- **Small-business bookkeeping:** income and expense log with categories mapped to the tax form's
  lines, transfers and owner draws kept out of profit, profit and loss per month, tax estimate,
  mileage, invoices. German editions follow EÜR and Umsatzsteuer; never promise a tax-compliant
  Fahrtenbuch.
- **Calculators** (pricing, Etsy fees and profit): inputs on one form, the results in large type.
- About seven visible tabs. German editions of proven templates are underserved: build `de` too.

## Phase 2: workbook.json

```json
{
  "editions": [{"key": "en", "language": "en", "currency": "USD"}, {"key": "de", "language": "de", "currency": "EUR"}],
  "today": "2026-10-19",
  "words": {"needs": {"en": "Needs", "de": "Fixkosten"}},
  "sheets": [
    {"key": "start", "name": {"en": "Start Here", "de": "Start"}, "kind": "guide", "lines": [{"en": "# Budget", "de": "# Haushaltsbuch"}, "…"]},
    {"key": "settings", "name": "…", "kind": "form", "cells": [
      {"name": "month", "label": "…", "type": "date", "value": "2026-10-01"},
      {"name": "month_end", "label": "…", "type": "date", "formula": "=EOMONTH([month],0)"}]},
    {"key": "categories", "name": "…", "kind": "table", "rows": 40, "columns": [
      {"key": "name", "title": "…", "type": "text"},
      {"key": "group", "title": "…", "type": "enum", "values": ["@needs", "@wants"]},
      {"key": "spent", "title": "…", "type": "money", "formula": "=IF([.name]=\"\",\"\",-SUMIFS([log.amount],[log.category],[.name]))",
       "highlight": [{"if": "<0", "style": "bad"}]}],
     "seed": [{"name": {"en": "Rent", "de": "Miete"}, "group": "@needs"}]},
    {"key": "dashboard", "name": "…", "kind": "report", "widths": [2, 30, 16], "cells": [
      {"at": "B4", "text": "…", "style": "label"},
      {"at": "C4", "name": "income", "type": "money", "formula": "=SUMIFS([log.amount],[log.amount],\">0\")"}],
     "charts": [{"type": "doughnut", "title": "…", "labels": "[categories.name]", "values": "[categories.spent]", "at": "B12"}]}
  ],
  "datasets": {"example": {"tables": {"log": [{"date": "2026-10-01", "amount": 3200}]}, "cells": {"month": "2026-10-01"}}},
  "expect": {"empty": {"income": 0}, "example": {"income": 3200, "categories.spent[1]": 1200}}
}
```

- Kinds: `guide` (lines; `# ` a title, `## ` a heading), `form` (labelled inputs and results stacked
  in column C), `table` (typed columns, `rows` it holds, `seed` rows the blank template ships with),
  `report` (cells at positions, charts). `hidden: true` hides an optional module.
- Types: text, number, money, percent, date, enum. Styles: title, heading, label, input, output, note, total. Highlights: `<0`, `>=100` or a
  formula such as `=[.spent]>[.budget]`; the first that holds colors the cell (good, bad, warn, muted).
- Any text is one string or one per language; every edition's language needs its text.
- Enum dropdowns come from `values` or `from: "categories.name"`; they warn and never refuse.
- Guard every division and lookup with IF or IFERROR: the blank template must compute without errors.
  Compare with `[.name]=""`, not ISBLANK, so cleared cells count as empty.
- `today` fixes TODAY() for checks; files keep TODAY() live.
- Datasets fill tables by sheet key and named cells; `empty` is the blank template. Expected values
  name a cell (`income`), a table cell (`categories.spent[2]`, rows from 1) or `sheetkey!C4`.

Run `lfm compile` after every change and fix every `spreadsheet.workbook` and `spreadsheet.formulas`
finding; each names the cell, the dataset and the formula. `lfm serve` shows every edition computed
with the example at `/<path>/preview/<edition>.html`, or `/spreadsheet/preview/` when sold in shops.
Look at every tab there: totals, highlights, charts, empty rows, the German formats.

## Phase 3: release

`lfm compile --release` prints a start-here PDF per edition (the copy button first, the steps from the
guide sheet, Excel and Numbers notes, the licence), and renders the listing images. With LibreOffice
installed it recalculates every file there too: `spreadsheet.compat` names any cell another app computes
differently. The report's `optional` line names helpers that are not installed and what each would add;
pass it on to the owner, whose choice it is. Open one
.xlsx in Excel or LibreOffice yourself and type a transaction; the dashboard must follow.

## Phase 4: Google Sheets, the owner's step

Only the owner's Google account can create the master buyers copy. Hand the owner these steps per file
(`<slug>-<edition>.xlsx` and `-example.xlsx` in `output/<path>/`): upload to Google Drive; File > Save as
Google Sheets; File > Settings: the edition's locale; Share: anyone with the link, viewer; paste the
address into `deliverables.spreadsheet.sheets` as `"en"` and `"en-example"`. Never edit a master after
selling. The next compile puts the copy link into the start PDF and the download page.

## Phase 5: listing, delivery, shops

Write deliverables/spreadsheet/listing.md in the printable's format (Title, Description, Tags, Price, AI). The
description opens with the buyer's situation, says what is included (Google Sheets copy link, the .xlsx,
the filled example), what it works with, and that nothing is shipped. Run `lfm compile` until
`spreadsheet.listing` and `spreadsheet.channels` are clean.

- Sold through the page (`sell: page`), the report prints the download address: Stripe redirects there.
  Sold in shops (`sell: shops`), distribution/spreadsheet/ holds each file once, the images, and a
  guide per shop with the files, images and fields; link the live listing back to the page's offer.
- Sold with the project's other deliverables as one kit (`sell: bundle`), `deliverables.bundle` lists
  them in its `units` and its own listing; `lfm help config deliverables.bundle` shows how.
- Hand the owner the README: accounts, prices, tax and uploads are theirs.
