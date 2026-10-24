---
name: lfm-research
description: Collects verbatim posts, comments and reviews from real buyers and records how competing pages open and sell, keeping research/human-voices.md and research/competitor-analysis.md exact. Use before designing or rewriting a sales page, when new customer signals arrive, or when asked for voice-of-customer research, review mining, what people say about a topic, or a competitor analysis in an lfm project. Not for writing copy or making design decisions; those read these files.
license: MIT
compatibility: Works with any toolset. Uses web search, page fetching, a browser or data connectors when available, and asks the user for sources otherwise.
metadata:
  lfm-version: "0.1.9"
  lfm-sha256: "185424eb2efe9e6571e371f7c864b1b9723cd34880eff246dd0eb55e46bd97de"
---

# Research for an lfm page

A model asked for an original page returns the typical page. Real human writing is the input that breaks
this: specific, uneven and different for every topic. This skill collects it, plus a factual record of what
competitors already do, into two files that every later design decision cites by ID.

## Rules that always hold

1. **Verbatim or nothing.** Copy the relevant passage exactly as written, typos and emoji included; mark
   every cut, including dropped hashtags and mentions, with `…`. Paraphrase, translation or cleanup turns
   a buyer's voice into model text, which is what this research exists to avoid.
2. **Never write from memory.** Every item comes from a source you opened in this session or the user
   supplied. A fluent invented quote cannot be told apart from a real one later, so a gap is always
   recorded as unreachable, never filled.
3. **Read before write, append only.** Open the existing file first and add a new dated batch. Existing
   entries are never edited, reordered or deleted, because later decisions cite their IDs.
4. **Every item is retrievable.** URL, platform, author type, post date as precise as the source shows,
   fetch date and how it was fetched. If someone cannot reopen it, it is not evidence.
5. **Public access only.** Search engines, public pages, feeds and threads. Never log in, bypass a wall or
   scrape at volume. A browser where the user is already signed in counts as logging in; use it only when
   the user explicitly allows it. A page a plain browser opens without a challenge is public; a challenge,
   a login or a paywall is a wall. Otherwise record the platform as unreachable.
6. **Observations, not interpretation.** Voices are what people wrote; peers are what pages show, plus the
   counted grid, baseline and gaps derived from those observations. Themes, conclusions and design
   choices belong in the project brief and are derived again from these files each time.

## Step 0: check your access

Look at the tools you actually have; do not assume. For each source use the first option that works, and
before collecting say in one line which access you have:

1. A connector installed in your session for the platform (social, reviews, analytics). Record
   `via connector`. A public API you call yourself counts as fetching.
2. Opening a page or public feed directly, found by web search or already known. Record `via fetch`.
3. A browser, for pages that need JavaScript or load comments late. Record `via browser`.
4. Sources the user pastes or exports into the conversation. Record `via user`.
5. Nothing works for a platform: name it in the batch heading's `unreachable` list.

Use a page tool only if it returns the page's own text. Some fetch tools hand back a model's summary of
the page; quotes taken from such output are not verbatim, so switch to another option or record the
platform as unreachable. The file format is the same whatever access you have.

## Choose the mode

- **From zero** when a file is missing or below its minimum. Write its title line if it lacks one, then
  collect until the minimums hold.
- **Ongoing** when a new signal arrives (customer messages, reviews, analytics, launch reactions, a new
  competitor) or one aspect needs depth (an objection, a section, a platform not yet covered). Append one
  batch to the file it concerns.

## Workflow

Copy this checklist into your notes and tick it off:

```
- [ ] Access checked and stated; mode chosen
- [ ] Both files read in full; next free IDs noted
- [ ] Queries planned, including ones that could contradict the current view
- [ ] Voices collected and written as a new batch
- [ ] Peers visited and written as a new batch; grid, baseline and gaps updated
- [ ] Validation passed for both files
- [ ] Shortfalls and unreachable platforms reported to the user
- [ ] `lfm compile` run; its `Next` line names the step that follows, normally the lfm-design skill
```

**Voices.** Prefer the platforms visitors arrive from: short video, image and microblog platforms first,
then communities and reviews (forums, app and marketplace reviews, review sites, Q&A threads). Search in
the buyers' language; for a local offer add map and booking reviews and the area's groups and forums. Seek the
buyers' own words about the problem, the current options, the result they want, what they make and post,
and what annoys them. Keep the mix honest:

- at most 40% of a batch from one platform and at most two items per author, so one loud corner cannot
  dominate;
- praise, complaints, rituals, questions and posts people made themselves, recent and older;
- at least one search per batch aimed at disagreement with the majority or the current page.

Skip AI-generated posts, marketing posing as users, and affiliate or promotional content; when unsure,
leave it out. For video, copy the caption, plus the spoken words when a transcript is available. Use the
observer note for what you see beyond the words: for image and video posts the subject, framing, colour,
light, text overlay, format and pace; for any post, visible counts such as likes or upvotes.

**Peers.** Pick pages the buyer would compare against, including some that rank in search and some that
circulate where the buyer looks. Open each at phone width when you can and record every fact. Then recount
the grid across all peers, update the baseline (the most frequent value per fact: the page this market
already has) and list gaps no peer uses.

**Project totals across all batches, whatever the first batch is called:** 60 voices from 5 platforms, including an image or video
platform when one is reachable, and 12 peers. **Stop** when the minimums hold and the last 10
voices you found, in the order you found them, brought no new platform and no new kind of problem or
wish (a new detail of a known problem does not count), or at twice the minimums, whichever comes first.
If the minimums cannot be met, add `shortfall: <what and why>` to any batch heading in either file; it waives both voice and peer minimums and stays visible in the report. Ongoing and refresh batches only add to the totals; they have no separate minimum and end when the trigger is covered.

## research/human-voices.md format

Use exactly this structure, so batches from different sessions and tools stay comparable:

```markdown
# Human voices: <project>

## Batch <YYYY-MM-DD> · <from zero | ongoing: trigger> · queries: "<query>", "<query>" · unreachable: <platforms or none> · shortfall: <only when minimums are not met>

### V<NNN> · <platform> (<place>) · <buyer | adjacent | creator | brand | expert> · posted <YYYY-MM-DD | YYYY-MM | YYYY | unknown> · fetched <YYYY-MM-DD> · via <connector | fetch | browser | user>
> <exact text>
> <next line of the same text, if any>
<https://source.url>
Observer note: <only when there is something to observe>
```

- IDs are `V` plus three digits, continuing across batches (`V001`, `V002`, …), never reused.
- The platform is the service (YouTube, Mumsnet, App Store); the optional place in parentheses narrows it
  (a subreddit, a video title, an app's review page). Comments on independent blogs are platform `Blog`
  with the blog as the place. This keeps platform counts meaningful.
- Author: `buyer` would buy this; `adjacent` lives close to the problem (a partner, a colleague in another
  role, a fellow hobbyist answering in a forum); `creator`, `brand` and `expert` (a professional answering)
  speak about it publicly.
- Fetched: today's date where you are, except imported items retain their original fetch date.
- Posted: as precise as the source shows. A relative age counts back from the fetch date and keeps only
  its unit's precision: "5 years ago" seen on 2026-10-17 is `2021`, "8 months ago" is `2026-02`, "3 days
  ago" is `2026-10-14`. Never add a day or month the source does not give.
- Every line of a quote starts with `> `, blank ones with `>`, so the text may contain anything. Fields
  never contain ` · `.
- Numbers about behaviour (sales, clicks, survey counts) go into their own table under the batch heading,
  each row with its source.

## research/competitor-analysis.md format

```markdown
# Competitor analysis: <project>

## Batch <YYYY-MM-DD> · <from zero | ongoing: trigger>

### P<NNN> · <name> · https://peer.url · fetched <YYYY-MM-DD> · via <connector | fetch | browser | user>
- Opening: <headline claim>; <hero>; <first action>
- Palette: …
- Type: …
- Imagery: …
- Motion: …
- Mechanism: …
- Proof: …
- Price: …
- Tone: …
- Takeaway: <what a visitor can save, share or receive>

### Grid after this batch

| Column | Value | Peers |
| --- | --- | --- |
| Opening | <value> | 7 |

### Baseline

<One paragraph: the most frequent value per fact.>

### Gaps

- <a value no peer uses>
```

Every peer has all ten facts, one per line; write `none` when a page shows nothing. Decline optional
cookies and record the page behind the banner; where a banner offers no decline, record what shows
without accepting. Peers are whatever the buyer weighs instead: other pages, books, shops, free
articles, apps. Group free-text values into grid buckets you name, a peer with
several values under the one its first screen leads with; the fact lines keep the exact values. The grid has one row
per value, and the counts of each fact add up to the number of peers in the file.

## Importing existing research

Reuse research for pages serving the same buyers by copying the relevant entries into the project's
research files; keep quotes and fetch dates, assign consecutive destination IDs and recount the grid.
For each imported voice, put one optional line after its source URL and optional Observer note; for a
peer, put it after the heading or facts: `Imported: YYYY-MM-DD from <origin file or page and original item ID>`.
Use the import date and a nonempty origin identifying where the item came from, for example
`Imported: 2026-10-17 from ../home/research/human-voices.md V014`.
Only this line records provenance: keep a single Observer note and do not add standalone Origin fields.
Imported fetch dates may precede the batch; future dates and posted/fetched/import ordering are still
checked. Imports count toward totals and duplicate quotes or peer URLs are still reported.

## Validate before saving

`lfm compile` parses both files and reports every `research.*` finding with its line; when you can run
it, fix what it reports. Research is checked before template preparation, so findings remain in the human or `--json` report even when templates are incomplete; run it from an initialized project. Either way, check each file yourself before you finish:

- headings and field order match the format exactly; dates are as precise as their sources;
- IDs are unique, consecutive and continue from the previous batch;
- each grid column's counts add up to the number of peers in the file;
- every entry has a URL, every quote sits in a `>` block, and no field is an empty placeholder;
- no earlier batch changed (compare against what you read);
- project totals meet the minimums, or a `shortfall` names what is missing; diversity limits still apply.

## When a source is unreachable

Name it in the batch heading's `unreachable` list with the reason in parentheses and move to the next
option or platform. If nothing is reachable at all, ask the user to paste or export sources, and stop
rather than write anything else.

## Gotchas

- Search result snippets are not the post. Open the page; snippets are cut and reordered.
- Comment threads often load late. Use a browser, or record the platform as unreachable.
- If a tool loses characters such as emoji or line breaks, reopen the source another way; if none
  preserves them, keep the item and say so in its observer note. Emoji shown as images carry the
  character in their alt text.
- A comment without its own link uses the URL of the page that shows it; the place names the thread.
- Interface text inside a post (a rating widget's "5 stars", a "Reply" button) is not the author's words;
  leave it out without a cut mark.
- Quoting your own summary of a page as a voice is fabrication with extra steps.
- The same post often appears on several sites. Keep the original and skip the copies.

## Examples

<example>
### V014 · Reddit (r/pourover) · buyer · posted 2026-01-13 · fetched 2026-10-17 · via fetch
> Numbering feels way less intimidating than words. And yeah, if someone suddenly goes 'I loved #3' it makes the follow up so much easier.
<https://www.reddit.com/r/pourover/comments/1qbely1/>
</example>

<example>
### V031 · TikTok · creator · posted 2026-06 · fetched 2026-10-17 · via browser
> the payoff is coming I can feel it …
<https://www.tiktok.com/@example/video/7656547532020976910>
Observer note: phone screen recording of a code editor, white caption box at the top, talk-show still inserted after two seconds, fast cuts; 4,180 likes.
</example>

<example>
### P003 · Trade Coffee · https://www.drinktrade.com/ · fetched 2026-10-17 · via browser
- Opening: "Coffee matched to your taste"; bag packshots; "Take the quiz"
- Palette: white, black, one citrus accent
- Type: one geometric sans
- Imagery: studio packshots of bags
- Motion: none
- Mechanism: taste quiz leading to a subscription
- Proof: star rating and press logos
- Price: first bag free, then per bag
- Tone: second person, short sentences, no exclamation marks
- Takeaway: none
</example>

<example>
## Batch 2026-10-18 · ongoing: first refund request · queries: "refund", "didn't work for me" · unreachable: Instagram (login wall), X (login wall)
</example>
