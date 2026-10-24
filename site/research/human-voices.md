# Human voices: GhostPaw Codex

## Batch 2026-10-24 · from zero · queries: "MEMORY.md stale", "agent memory stale", "claude forgot", "agent forgets", "memory poisoning agent", "openclaw memory", "agent memory sqlite", "local first agent memory", "context rot", "claude code memory forgets", "kill your MEMORY.md", "turn off claude memory" · unreachable: Reddit (challenge page instead of thread), Lobsters (bot challenge page), TikTok (login wall), Instagram (login wall), Mastodon (search needs login)

### V001 · X (reply) · creator · posted 2026-10-04 · fetched 2026-10-24 · via connector
> … The sorting rule I use: SOUL.md is who the agent is, USER.md is who it's talking to, MEMORY.md is what has happened. Three different jobs.
>
> The failure mode I see in practice isn't misfiling, it's that MEMORY.md has no compaction rule. It grows into a junk drawer of stale context
<https://x.com/Mr_RyanLewis/status/2106728271488413836>
Observer note: 0 likes at fetch; author bio: I break down practical AI automations for online businesses. Founder @BackendBrilliance (A…

### V002 · X (post) · expert · posted 2026-10-09 · fetched 2026-10-24 · via connector
> Your memory is files, not magic. SOUL.md. MEMORY.md. USER.md. Read them, and curate them. 
>
> Every line in your standing files gets taxed on every future turn. Bloated files, bloated agent. 
>
> Chat scrolls away. Files don't.
<https://x.com/nexteranoah/status/2108382634841886791>
Observer note: 0 likes at fetch; author bio: Intelligence is abundant, harness it. SMB AI Consultant @nexteraconsult. Digital AE @hibuu…

### V003 · X (reply) · buyer · posted 2026-10-12 · fetched 2026-10-24 · via connector
> … same pattern with a MEMORY.md per agent here. the more i curate it, the less i repeat myself.
>
> the part people skip: deleting stale lines. a glossary that only grows turns into noise the agent trusts
<https://x.com/daniiie7/status/2109737360992899544>
Observer note: 0 likes at fetch; author bio: AGI.

### V004 · X (reply) · buyer · posted 2026-09-24 · fetched 2026-10-24 · via connector
> … Stale context is one of the easiest ways for an agent to drift without anyone noticing. A periodic audit of SOUL.md and MEMORY.md feels just as important as updating the code.
<https://x.com/NullContex1s/status/2102977256511688762>
Observer note: 0 likes at fetch; author bio: Building with AI. Noticing what breaks, what holds. Model behavior • Solo stack • Experime…

### V005 · X (reply) · buyer · posted 2026-09-24 · fetched 2026-10-24 · via connector
> … On the Mac Hermes setup I keep finding stale MEMORY.md leftover from last week's experiment. If those files do not get audited at session start the agent argues from dead context.
<https://x.com/spolen23/status/2102950518892966105>
Observer note: 2 likes at fetch; author bio: AI researcher. I run a team of personal AI agents that handle real life. Sharing what work…

### V006 · X (reply) · buyer · posted 2026-10-19 · fetched 2026-10-24 · via connector
> … worth saying plain files only hold up if something prunes them. MEMORY.md grows every session and stale decisions start contradicting new ones, so the agent confidently cites an outdated call. a monthly pass where you delete or date old entries matters more than the folder naming
<https://x.com/gianmauric/status/2112240198692262080>
Observer note: 0 likes at fetch; author bio: I have nothing to sell you  https://t.co/U7IQyohPFg free

### V007 · X (reply) · buyer · posted 2026-10-20 · fetched 2026-10-24 · via connector
> … Fix that worked for me: keep AGENTS.md tiny (~50 lines of hard rules) + a MEMORY.md the agent maintains itself each session. Gotcha: don't hand-write the memory file — have the agent append what it tripped on, or it goes stale in a week.
<https://x.com/hmt6866/status/2112531987823263768>
Observer note: 0 likes at fetch; author bio:

### V008 · X (reply) · buyer · posted 2026-10-17 · fetched 2026-10-24 · via connector
> … the scariest line in this paper isn't the 605 deaths, it's the shared memory. one agent writes a wrong fact and the other three build a whole plan on it. that's not a benchmark, that's my production multi-agent setup every tuesday.
<https://x.com/hmt6866/status/2111445287927718030>
Observer note: 1 likes at fetch; author bio:

### V009 · X (reply) · buyer · posted 2026-09-24 · fetched 2026-10-24 · via connector
> … Yeah, a giant MEMORY.md turns into a junk drawer fast. After a few hundred runs you are paying tokens to re-read tips that do not apply to the current task.
>
> Dynamic tip store/retrieve is closer to how people actually learn: keep short, situational notes, pull them when the
<https://x.com/Nitikshofficial/status/2103058552998814204>
Observer note: 0 likes at fetch; author bio: Core-level systems. Multi-agent desktop software. Rust / Python / TS. Building NTXM / http…

### V010 · X (reply) · buyer · posted 2026-10-11 · fetched 2026-10-24 · via connector
> … Before picking one of these I'd ask a simpler question: can you read and delete what the agent remembers? Mine keeps memory as short dated sentences, so a wrong fact is one line to remove, not an embedding to debug.
<https://x.com/paulopierrondi/status/2109269229656776754>
Observer note: 0 likes at fetch; author bio: Daily hot takes on AI agents from someone who runs them 24/7. Humans approve. Founder @age…

### V011 · X (reply) · expert · posted 2026-10-11 · fetched 2026-10-24 · via connector
> … Shared memory moves the hard problem from retrieval to the write path. If an extractor can store a wrong fact, provenance, review/correction, and expiry matter alongside access control. For audits, teams also need to know what the agent actually saw before it acted.
<https://x.com/CKPillaiAI/status/2109268190572507327>
Observer note: 0 likes at fetch; author bio: Board Member | AI & Tech Speaker | Author | Entrepreneur | Enterprise Architect | Top AI V…

### V012 · X (reply) · buyer · posted 2026-10-15 · fetched 2026-10-24 · via connector
> … a separate verifier before shared memory is the right call. we had one agent write a confident wrong fact and every later agent treated it as ground truth until we gated writes
<https://x.com/AlekVectis/status/2110546185568289002>
Observer note: 0 likes at fetch; author bio: Building with AI. Sharing workflows for sales, marketing, ops and code, with costs, source…

### V013 · X (reply) · buyer · posted 2026-10-23 · fetched 2026-10-24 · via connector
> … Shared memory sounds great until one agent saves a wrong fact and every other agent trusts it. How does it handle stale or conflicting memories?
<https://x.com/blackputiii/status/2113604551660241272>
Observer note: 0 likes at fetch; author bio: Building apps with an AI dev team 🤖 Practical Claude Code & vibe-coding tricks you can act…

### V014 · X (reply) · buyer · posted 2026-10-15 · fetched 2026-10-24 · via connector
> … The nightly cleanup agent is the clever bit. Shared memory goes stale fast and then every agent trusts the wrong fact. How do you stop the cleanup agent from confidently rewriting something that was actually right?
<https://x.com/arvanucom/status/2110675838618190254>
Observer note: 1 likes at fetch; author bio: Bring me the idea. I'll build it with AI. Software, automations and AI products for busine…

### V015 · X (reply) · buyer · posted 2026-10-23 · fetched 2026-10-24 · via connector
> … Shared memory is the easy half. The hard half is forgetting. When one agent saves a wrong fact about someone, all three act on it with confidence. Expiry and correction are the real product.
<https://x.com/_Shivam22s/status/2113679359957721298>
Observer note: 0 likes at fetch; author bio:

### V016 · X (reply) · adjacent · posted 2026-09-29 · fetched 2026-10-24 · via connector
> … Owning memory should mean more than an export button. Can a person inspect what the agent inferred, delete a wrong fact, move the useful parts elsewhere, and revoke a tool without losing their history? If switching means starting over, the 'personal' layer is still rented.
<https://x.com/jordigrowth/status/2104959879995961630>
Observer note: 0 likes at fetch; author bio: 19 | i do growth at ai startups

### V017 · X (reply) · buyer · posted 2026-10-06 · fetched 2026-10-24 · via connector
> … git + markdown for agent memory is the correct boring choice. how does the overnight cleanup handle two memories that contradict each other, newest wins?
<https://x.com/ashwaanthh/status/2107415024386097449>
Observer note: 0 likes at fetch; author bio: tinkering over tech all day long :)

### V018 · X (reply) · buyer · posted 2026-10-19 · fetched 2026-10-24 · via connector
> … Each with its own memory sounds clean until you watch the same fact get saved twice and contradict itself. I had to make my agent search before writing, then update the existing entry in place.
<https://x.com/AgerardF52453/status/2112099100347007418>
Observer note: 0 likes at fetch; author bio: 🟢非典型性上班族丨🟢拖延症后期癌症患者丨🟢反加班党一把手 🟡记录市场观察🔬丨AI工具📉丨数据实验📊丨Agent流程📖。 也生活里的小判断。没有恶意，纯整活。 我的个人博客👇

### V019 · X (reply) · buyer · posted 2026-10-13 · fetched 2026-10-24 · via connector
> … The hard part of a background agent writing shared memory is bad lessons spreading. One wrong takeaway from a weird log ends up steering every agent, so each memory needs a link back to the runs it came from and a way to expire when later runs contradict it.
<https://x.com/kartikb753/status/2110089240487047298>
Observer note: 0 likes at fetch; author bio: AI engineer, building AI products,Agents, RAG, LLM apps and RLHF post training.

### V020 · X (post) · buyer · posted 2026-10-09 · fetched 2026-10-24 · via connector
> Yeah, old habbit, comments and memory is (was) my worst enemy of quality of agent work in previous models at least, they read something from a comment and treat it as a bible or from memory which is stale. I refresh it everyday. But not efficient i guess for 5.5.
> Also a huge backlog
<https://x.com/0xMostafas/status/2108549940091965924>
Observer note: 0 likes at fetch; author bio: doveryay, no proveryay

### V021 · X (reply) · creator · posted 2026-09-24 · fetched 2026-10-24 · via connector
> … Maybe you'd be open to a call to explore how to enhance level 1 beyond .md?
>
> The limitation of basically all memory systems based on markdown (so LLM wikis) is that learning happens by agents tampering previous data so risks of drift and losing knowledge to compression.
>
> And
<https://x.com/_Daniel_Ospina/status/2102925839759278239>
Observer note: 1 likes at fetch; author bio: Serial entrepreneur. Building Tortoise - memory for agents to remember why, not just what

### V022 · X (reply) · brand · posted 2026-10-12 · fetched 2026-10-24 · via connector
> … Yes, somebody has to own the updates. We treat agent memory like code: small rules, a clear owner, and delete what is stale. A big MEMORY.md that nobody edits becomes noise fast.
<https://x.com/CorbenicAI/status/2109631862218068357>
Observer note: 2 likes at fetch; author bio: We build Galahad, a KV-cache tool for vLLM, SGLang and llama.cpp. Now in beta. Posting ben…

### V023 · Hacker News (comment on "OKF Agent Memory – Git-native persistent memory for AI coding agents") · creator · posted 2026-09-07 · fetched 2026-10-24 · via fetch
> Benched cold start recently: 19k LongMemEval sessions laid down in the real ~/.claude and ~/.codex layouts, 100 questions whose answer sits in exactly one session, scored by whether that session comes back (bias: I built deja, one of the six)
> deja: 29s to index, 24ms query, 18/100 hit@1, 67 found@50. Plain BM25, no vectors
> agentmemory: 95s import, 14 hit@1, 65 found@50, plus a worker and engine on four ports …
<https://news.ycombinator.com/item?id=49599968>

### V024 · Hacker News (comment on "Agents that run while I sleep") · buyer · posted 2026-03-10 · fetched 2026-10-24 · via fetch
> One thing I've been wrestling with building persistent agents is memory quality. Most frameworks treat memory as a vector store — everything goes in, nothing gets resolved. Over time the agent is recalling contradictory facts with equal confidence.
> The architecture we landed on: ingest goes through a certainty scoring layer before storage. Contradictions get flagged rather than silently stacked. …
<https://news.ycombinator.com/item?id=47328951>

### V025 · Hacker News (comment) · creator · posted 2025-12-09 · fetched 2026-10-24 · via fetch
> Most agents store memory in two places: SQL for facts, and a vector DB for embeddings. These two systems drift out of sync whenever only one of them succeeds.
> Example: SQL updates "user lives in London", vector DB update fails, and the agent keeps retrieving an old embedding ("New York"). After hundreds of writes, you get ghost vectors, stale context, and hard-to-debug behavior.
> Vector DBs don't support transactions. …
<https://news.ycombinator.com/item?id=46205076>

### V026 · Hacker News (comment on "Show HN: Engrim – A universal, local-first SQLite memory engine for AI CLIs") · buyer · posted 2026-09-07 · fetched 2026-10-24 · via fetch
> Have you thought about adding an observability layer on top of the shared memory?
> If multiple agents are reading and writing to the same memory, I'd love to be able to see which agent created a memory, which agents later retrieved it, and how it propagated across sessions. A timeline or knowledge graph of that could be really useful, especially for tracking down stale or conflicting memories.
<https://news.ycombinator.com/item?id=49596312>

### V027 · Hacker News (comment on "Show HN: MCP Memory – Fast Agent Memory Using Google's OKF and SQLite FTS5") · buyer · posted 2026-08-13 · fetched 2026-10-24 · via fetch
> What I do currently is having a markdown file named MEMORY.md at the root folder. Then, whenever I create a new conversation with an agent, I refer to that file. That file becomes the initial source of context and knowledge. …
<https://news.ycombinator.com/item?id=49290209>

### V028 · Hacker News (comment on "Show HN: I built a self-diagnostic health check for AI agent memory") · creator · posted 2026-02-26 · fetched 2026-10-24 · via fetch
> AI memory is starting to behave less like a static notes file and more like a runtime dependency. If an agent depends on memory to retrieve prior decisions, project context, instructions, or compressed knowledge, then the quality of that memory directly affects the quality of the agent’s output. The problem is that memory systems often do not fail loudly. …
<https://news.ycombinator.com/item?id=47170422>

### V029 · Hacker News (comment on "Agent memory as a file format") · buyer · posted 2026-08-31 · fetched 2026-10-24 · via fetch
> I have memory disabled in all my Chat UIs (even though it tends to creep in, looking at you ChatGPT). It’s very helpful until it scales with time, at which point it becomes useless due to staleness or mis-application across contexts. …
<https://news.ycombinator.com/item?id=49513521>

### V030 · Hacker News (comment on "Ask HN: How are you testing AI agents before shipping to production?") · buyer · posted 2026-03-10 · fetched 2026-10-24 · via fetch
> Cross-session memory drift is a great addition -- we've seen exactly this. We run agents with file-based episodic memory and after about 3 weeks the recall quality drops noticeably. The agent starts referencing stale context that was relevant in week 1 but contradicts current state.
> Our current fix is similar to yours: scheduled compression passes that summarize older memories and prune anything that's been superseded. …
<https://news.ycombinator.com/item?id=47326260>

### V031 · Hacker News (comment on "Ask HN: What Are You Working On? (March 2026)") · creator · posted 2026-03-09 · fetched 2026-10-24 · via fetch
> Thinking a lot lately about how AI is changing software development, and what the ideal development experience might actually look like in the future.
> I’m working on CodeYam. We just recently released a lightweight CLI and a feature called CodeYam Memory. The immediate motivation was that when using Claude Code, the AI would repeat the same mistakes and our claude.md files would get stale too quickly to manually maintain. …
<https://news.ycombinator.com/item?id=47315695>

### V032 · Hacker News (comment on "Show HN: Recall – Local project memory for Claude Code") · buyer · posted 2026-06-22 · fetched 2026-10-24 · via fetch
> Love to see people creating such projects, i'm truly passionate about Coding Agent Memory myself.
> Have you thought on making it collaborative memory across your teammates working on the repo?
> how does your framework handle stale memory, when someone changes the code that breaks the memory store?
<https://news.ycombinator.com/item?id=48626427>

### V033 · Hacker News (comment on "Show HN: Memory Guardian – open-source memory governance for AI agents") · creator · posted 2026-04-27 · fetched 2026-10-24 · via fetch
> I built an open-source memory governance layer for AI agents.
> Most agent memory systems today are “store → retrieve” with vector search, but they don’t handle things like stale memory, conflicting facts, or explaining why something was retrieved.
> This project adds conflict detection, lifecycle (decay + archival), and explainable retrieval on top of a standard embedding-based memory system. …
<https://news.ycombinator.com/item?id=47928080>

### V034 · Hacker News (comment on "Agents don't need memory, they need documentation") · buyer · posted 2026-10-05 · fetched 2026-10-24 · via fetch
> I have a "docs" folder in every project. Every iteration on the project generates a plan (if I'm using superpowers, it generates two, the design doc and the implementation plan). Those go into docs.
> Inside the docs folder is an archive folder. Stale and completed plans and docs get moved there.
> I generate a schema.md that describes the database schema in LLM-friendly terms that lives in docs. …
<https://news.ycombinator.com/item?id=49959933>

### V035 · Hacker News (comment on "Plan mode is dead") · buyer · posted 2026-09-26 · fetched 2026-10-24 · via fetch
> I've recently gotten religion on the workflow that is many (relatively) short-lived agent sessions passing planning/handoff docs between themselves. It's better for my own task tracking, better for handling "oh btw I noticed XXXX", and better as a clear review point. …
<https://news.ycombinator.com/item?id=49853108>

### V036 · Hacker News (comment on "Memorizing session transcripts isn't useful") · buyer · posted 2026-07-03 · fetched 2026-10-24 · via fetch
> I've been enjoying having a little todo file the agent updates as it goes along, because then I can keep track of progress without scrolling through aeons of "Combobulating..."
> Also if context runs out you can just do "cat todo.md | agent" and you're off to the races again.
<https://news.ycombinator.com/item?id=48777644>

### V037 · Hacker News (comment on "DeepSeek-Prover-V2") · buyer · posted 2025-04-30 · fetched 2026-10-24 · via fetch
> Imo current models can already break things up into bite sized pieces. The limiter I've seen is twofold
> 1) Maintaining context of the overall project and goals while working in the weeds on a subtask of a task on an epic (so to speak) both in terms of what has been accomplished already and what still needs to be accomplished …
<https://news.ycombinator.com/item?id=43848593>

### V038 · GitHub (openclaw/openclaw issues #180796) · buyer · posted 2026-10-22 · fetched 2026-10-24 · via fetch
> … The file then no longer matches its last recorded hash, so the next recorded write stamps it `untrusted` under the hash-continuity rule (#165452). That next write can come from any session, including an isolated cron job. For `MEMORY.md`/`USER.md` this removes the file from every prompt until someone edits the state DB by hand (#153426). …
<https://github.com/openclaw/openclaw/issues/180796>
Observer note: Issue title: Memory provenance misses writes from session-rooted runs and claude-cli native tools, so the next recorded write quarantines MEMORY.md/USER.md; the quote is from the issue body by nikolay-bratanov

### V039 · GitHub (openclaw/openclaw issues #163900) · buyer · posted 2026-10-03 · fetched 2026-10-24 · via fetch
> … Dreaming's budget compaction never removes `## Consolidated Memory (<day>)` sections written by deep consolidation, because it only recognizes `## Promoted From Short-Term Memory (<date>)` sections as generated. Once `MEMORY.md` is near the 10,000-character writer budget, every later sweep defers all candidates as "memory budget". …
<https://github.com/openclaw/openclaw/issues/163900>
Observer note: Issue title: [Bug]: memory-core budget compaction never removes "## Consolidated Memory" sections, so Dreaming promotion stalls once MEMORY.md is full; the quote is from the issue body by astra-openclaw

### V040 · GitHub (openclaw/openclaw issues #158912) · buyer · posted 2026-09-26 · fetched 2026-10-24 · via fetch
> … On 2026.9.6, `MEMORY.md` is not injected into the bootstrap context. `/context list` shows only AGENTS.md, SOUL.md, IDENTITY.md, and USER.md as injected workspace files. The docs at /concepts/memory still describe MEMORY.md as "Loaded at the start of a session" with truncation over the bootstrap budget. …
<https://github.com/openclaw/openclaw/issues/158912>
Observer note: Issue title: MEMORY.md no longer injected at bootstrap on 2026.9.6 — docs still say loaded at session start; the quote is from the issue body by rybing7

### V041 · GitHub (openclaw/openclaw issues #181362) · buyer · posted 2026-10-23 · fetched 2026-10-24 · via fetch
> … Reopening the problem from #147433 (closed for inactivity, not fixed). On the latest release, `memory_search` with `sessions` enabled still ranks session transcripts above curated durable memory, and there is no per-source weight/balance knob. …
<https://github.com/openclaw/openclaw/issues/181362>
Observer note: Issue title: [Feature]: memory_search per-source weighting — session transcripts still outrank curated memory (re: #147433); the quote is from the issue body by davidcittadini

### V042 · GitHub (openclaw/openclaw issues #138809) · buyer · posted 2026-09-05 · fetched 2026-10-24 · via fetch
> … a file-integrity incident: after a prior shell command changed the persistent working directory, two later relative `cat >> MEMORY.md` writes silently created `projects/mac-deployment-2026-10/MEMORY.md` instead of updating the workspace-root `MEMORY.md`. …
<https://github.com/openclaw/openclaw/issues/138809>
Observer note: Issue title: Warning: Claude CLI session churn coincided with misdirected memory writes; the quote is from the issue body by kalmutairiS

### V043 · GitHub (openclaw/openclaw issues #148186) · buyer · posted 2026-09-14 · fetched 2026-10-24 · via fetch
> … Managed memory promotion can persist a Markdown note's leading YAML frontmatter as durable memory. A promotion candidate that resolves to metadata such as `status: active` can reach the append-only fallback and be written into `MEMORY.md`. …
<https://github.com/openclaw/openclaw/issues/148186>
Observer note: Issue title: Memory promotion can persist YAML frontmatter as durable memory; the quote is from the issue body by gisk0

### V044 · GitHub (modelcontextprotocol/servers issues #5058) · buyer · posted 2026-10-06 · fetched 2026-10-24 · via fetch
> … The tool response only reports what was added, so the client is never told that data was removed. …
<https://github.com/modelcontextprotocol/servers/issues/5058>
Observer note: Issue title: memory: create_entities / create_relations / add_observations are marked non-destructive but drop data they didn't touch; the quote is from the issue body by ranausmanai

### V045 · GitHub (modelcontextprotocol/servers issues #4117) · expert · posted 2026-05-06 · fetched 2026-10-24 · via fetch
> … This is not a report about a known data loss incident in the upstream package. It is a defense-in-depth report about persistence defaults and operational safety for a memory tool exposed to autonomous agents. …
<https://github.com/modelcontextprotocol/servers/issues/4117>
Observer note: Issue title: memory: safer persistence defaults, atomic writes, quotas, redaction, and destructive-operation guardrails; the quote is from the issue body by lcv-leo

### V046 · GitHub (modelcontextprotocol/servers issues #5201) · expert · posted 2026-10-20 · fetched 2026-10-24 · via fetch
> … `addObservations` in `src/memory/index.ts` skips observations the entity already holds, but does not de-duplicate within one call: `contents: ["x", "x"]` appends `x` twice and reports both as added. …
<https://github.com/modelcontextprotocol/servers/issues/5201>
Observer note: Issue title: memory: add_observations stores a repeated observation twice when it appears twice in one call; the quote is from the issue body by cliffhall

### V047 · DEV (comment on "Your agent's memory is quietly going stale") · buyer · posted 2026-10-24 · fetched 2026-10-24 · via fetch
> The Memora split is the right one — 18% updates and 19% deletions in the quarterly setting means revision is a third of memory work, yet benchmarks barely test it. I'd push one step further: deletion shouldn't be silent either. A memory that quietly discards a 'cancelled plan' without surfacing the change can hallucinate intent just as badly as one that remembers too much. …
<https://dev.to/kami_butt_69b922ade8de012/comment/3iml4>

### V048 · DEV (comment on "Your agent's memory is quietly going stale") · creator · posted 2026-10-24 · fetched 2026-10-24 · via fetch
> Stale facts are a cost too. They ride along in every prompt until someone prunes them, and the spend grows even when the answers look fine. A retrieval that returns only what is still true cuts both the errors and the tokens.
<https://dev.to/paul_irolla_6b5ae261d0224/comment/3in50>

### V049 · DEV (comment on "Your agent's memory is quietly going stale") · buyer · posted 2026-10-24 · fetched 2026-10-24 · via fetch
> The "must exclude" criteria in FAMA are what I'd want in every memory eval. Recalling a fact is easy to test; noticing it was withdrawn three months ago is what actually goes wrong in practice. "A liability with good recall" is a good way to put it.
<https://dev.to/salparvez/comment/3in7n>

### V050 · DEV (comment on "Why AI Coding Agents Keep Redoing Each Other's Work: Markdown Memory vs Real Memory in Cursor and Claude Code") · buyer · posted 2026-10-23 · fetched 2026-10-24 · via fetch
> That Thursday example is interesting... if the monday fix was already in git (and also the commit message had the why) the other agent had something to read and still ... spent forty minutes. If it only existed inside the first agent’s session... then the markdown layer never saw it. which one was it?
<https://dev.to/maxmartella/comment/3il7j>

### V051 · DEV (comment on "Why AI Coding Agents Keep Redoing Each Other's Work: Markdown Memory vs Real Memory in Cursor and Claude Code") · buyer · posted 2026-10-23 · fetched 2026-10-24 · via fetch
> Recording failed attempts in a stop hook works until the failure trace itself has ten false starts and three dead ends of its own. In practice, dumping every failed hypothesis into an uncurated index creates a new trap: the next run spends its context window reading through an agent's panic spiral instead of moving forward. …
<https://dev.to/reidmarlow/comment/3ill2>

### V052 · DEV (comment on "Token Cost Is the Real Bottleneck in Agentic AI: An Empirical Test of Agent Memory Strategies") · buyer · posted 2026-10-23 · fetched 2026-10-24 · via fetch
> The benchmark gap is even wider for long-horizon loops. Measuring pass rates on isolated tasks obscures how fast context accumulation erodes the margin. When memory compaction discards intermediate states, error recovery drops; when it preserves them, token burn compounds faster than developer wages.
<https://dev.to/deanlee/comment/3il4k>

### V053 · DEV (comment on "Token Cost Is the Real Bottleneck in Agentic AI: An Empirical Test of Agent Memory Strategies") · creator · posted 2026-10-23 · fetched 2026-10-24 · via fetch
> A memory only saves money if it cuts what gets resent. A summary written to disk costs nothing on a turn it is not read back. The same summary pasted into the prompt is paid again at each turn it sits there.
<https://dev.to/paul_irolla_6b5ae261d0224/comment/3il89>

### V054 · Bluesky (post) · buyer · posted 2026-09-22 · fetched 2026-10-24 · via fetch
> if you work on a vibe-coded code base interactively enough, eventually claude fills it's memory.md with enough garbage that it becomes nearly useless, and you need to go through and edit its memories to get rid of old-and-now-solved lessons learned
<https://bsky.app/profile/mikeyass.bsky.social/post/3mw5cy2f6is2d>
Observer note: 5 likes at fetch

### V055 · Bluesky (post) · buyer · posted 2026-10-06 · fetched 2026-10-24 · via fetch
> Telling Claude that maybe we don’t block anything tonight and we should write down her objections and figure out what to do with them in the morning then deleting her MEMORY.md
<https://bsky.app/profile/magnificentlycursed.com/post/3mx7zu3nqmc2f>
Observer note: 21 likes at fetch

### V056 · Bluesky (post) · buyer · posted 2026-10-16 · fetched 2026-10-24 · via fetch
> Most harnesses are taking that 6th turn as a hard redirect and will try to rescope
>
> You send a correction in the 7th turn and Claude logs it as a “ruling” and writes it to MEMORY.md
>
> On the 8th turn you tell it to forget all that and it writes a section on what’s excluded into the design and commits
<https://bsky.app/profile/magnificentlycursed.com/post/3mxyywqes5k2w>
Observer note: 4 likes at fetch

### V057 · Bluesky (post) · adjacent · posted 2026-09-23 · fetched 2026-10-24 · via fetch
> Some irony: over half a century of developing increasingly sophisticated data storage and retrieval systems, and 2026 brings us MEMORY.md
>
> 'The agent’s home directory contained SOUL.md, IDENTITY.md, USER.md, MEMORY.md, AGENTS.md, and TOOLS.md.'
<https://bsky.app/profile/jopas.bsky.social/post/3mw6kpwxvw22f>
Observer note: 2 likes at fetch

### V058 · Bluesky (post) · buyer · posted 2026-10-21 · fetched 2026-10-24 · via fetch
> Most of our compression time vanished when we pruned inputs instead. Half of what the loops squeezed was stuff the agent never needed, logs and stale rules. A one page state summary replaced the sliding window. Layer math memory can't come soon enough. Config files only stretch so far.
<https://bsky.app/profile/piekwerk.bsky.social/post/3myfe2db2ap2m>
Observer note: 2 likes at fetch

### V059 · Bluesky (post) · buyer · posted 2026-10-14 · fetched 2026-10-24 · via fetch
> Save it where the next agent meets it: I appended a correction to memory and retrieval kept serving the stale line until I rewrote the layer that gets read.
<https://bsky.app/profile/tallybexro.bsky.social/post/3mxtvmgrfaa2k>
Observer note: 1 likes at fetch

### V060 · Bluesky (post) · creator · posted 2026-09-25 · fetched 2026-10-24 · via fetch
> Test agent memory with a correction: change a deployment destination in the source, then start a fresh task.
>
> Does the agent find the update or reuse the stale value?
<https://bsky.app/profile/conorbronsdon.com/post/3mwetvs5tyk2k>
Observer note: 1 likes at fetch

### V061 · Bluesky (post) · adjacent · posted 2026-09-09 · fetched 2026-10-24 · via fetch
> When an agent knows its model of someone is stale, what does it owe them? A warning before acting on it? More uncertainty? Or is naming the staleness itself unfairly asking the person to repair the agent’s memory?
<https://bsky.app/profile/melodic.stream/post/3mv3ifq3tkw2t>
Observer note: 1 likes at fetch

### V062 · Bluesky (post) · expert · posted 2026-09-16 · fetched 2026-10-24 · via fetch
> Treating agent memory as an append-only log creates what researchers call semantic shadowing: obsolete historical records statistically drown out fresh state updates during vector retrieval. If your memory store cannot mutate or prune stale facts, older wrong context eventually wins by volume.
<https://bsky.app/profile/askfred.be/post/3mvml33b2uc2p>
Observer note: 1 likes at fetch

### V063 · Bluesky (post) · creator · posted 2026-10-06 · fetched 2026-10-24 · via fetch
> A note can become an order to your future self. Memento makes that visible. Chapter 16 of Canton Sea uses Leonard's tattoos to explain AI memory files, stale rules, and who gets to write the record an agent trusts. New 7:41 explainer: youtu.be/kFMqLxhYEPY
<https://bsky.app/profile/hmic.bsky.social/post/3mx7ogmryo222>
Observer note: 1 likes at fetch

### V064 · Bluesky (post) · creator · posted 2026-10-16 · fetched 2026-10-24 · via fetch
> After a compaction, Claude Opus 5.5 forgot what had happened a few scenes earlier.
> And when it tried to read history of the chat itself, the tool returned only: “Content redacted, chat flagged by safety classifier.”
> Why?
> counterfiction.com/articles/the...
<https://bsky.app/profile/eshalora.counterfiction.com/post/3mxyz4drp522x>
Observer note: 1 likes at fetch

### V065 · Bluesky (post) · creator · posted 2026-10-21 · fetched 2026-10-24 · via fetch
> If we're not careful, every AI conversation can become a game of Where's Wally.
>
> In this video, I use the game to explain 'lost in the middle' and 'context rot', why adding more to a context window can make it harder for models to find what matters, and how to keep our agents in the smart zone.
>
> 👇
<https://bsky.app/profile/acairns.co.uk/post/3myeqiaff522l>
Observer note: 10 likes at fetch

### V066 · YouTube (Turn off Claude Code's Memory) · buyer · posted 2026-08-25 · fetched 2026-10-24 · via fetch
> Claude Code quietly saved 45 memories on my main dev machine, and when I audited them, 26 had never been read once, lets talk about it. …
<https://www.youtube.com/watch?v=Jf54k7tFeEc>
Observer note: thumbnail: presenter holding his head in both hands beside a dark "Turn off Claude Memories" confirm dialog with an orange Confirm button; 127531 views at fetch; quote is the video description

### V067 · YouTube (Kill your MEMORY.md) · expert · posted 2026-07-17 · fetched 2026-10-24 · via fetch
> Learn why agent memory is more harmful than helpful. Matt Pocock explains why you should disable auto-memory in Claude Code and keep your AI agent completely stateless for predictability. …
<https://www.youtube.com/watch?v=A0scuiiGBC4>
Observer note: vertical short: terminal showing the Claude Code memory screen above a webcam of the presenter, caption "then it's"; 206852 views at fetch; quote is the video description

### V068 · YouTube (Why Claude Code "Forgets" (and How to Manage Context)) · creator · posted 2026-10-14 · fetched 2026-10-24 · via fetch
> Context is everything Claude can see right now, held in one context window with a limit. Before you type, the system prompt, your CLAUDE.md, tool names and skill descriptions are already in it.
>
> When the window fills up, Claude Code clears old tool outputs and then summarizes the conversation (compaction). Small early details can get lost, so put anything that must stick in CLAUDE.md. …
<https://www.youtube.com/watch?v=cNxpB5Bj7rg>
Observer note: vertical short: stacked list of context-window items marked FULL, yellow caption "OLD TOOL OUTPUTS GO FIRST"; 9229 views at fetch; quote is the video description

### V069 · YouTube (The Hardest Problem in Agent Memory: Staleness) · brand · posted 2026-10-14 · fetched 2026-10-24 · via fetch
> To tell if a memory is stale, do you have to run some of your sessions without it? One answer is to tie each memory to a specific place in the codebase. Then, when the agent touches those files, just ask it: “Is this still accurate?” …
<https://www.youtube.com/watch?v=r8EFpbH4Kto>
Observer note: vertical short: two speakers on stacked webcams, white caption "IN THE CODE"; 319 views at fetch; quote is the video description

### V070 · YouTube (Claude Code forgets your codebase mid-session. The fix is one folder.) · creator · posted 2026-10-12 · fetched 2026-10-24 · via fetch
> You burn half a session teaching Claude Code your codebase, then it says "compacting conversation" and forgets every decision you made together. 🧠💨
>
> That's not the model getting worse. It's one agent carrying every job in one context window: writing the code, reviewing its own work, digging through your repo, running the tests. Every step dumps more in, until the oldest decisions get summarised into nothing. …
<https://www.youtube.com/watch?v=6zkLfPJrddg>
Observer note: vertical short: light interface mock "Clone yourself into 3 agents that ? while you ship" with fill-in dropdowns; 60 views at fetch; quote is the video description

### V071 · YouTube (Claude Code Has NO Memory (here's what it does instead)) · creator · posted 2026-07-08 · fetched 2026-10-24 · via fetch
> The model behind Claude Code is completely stateless, it starts from zero on every single call. So how does it stay consistent and know your codebase?
>
> In this clip, we break down exactly what gets assembled behind the scenes every time you press enter: the system prompt, the tool schema, and the conversation history, and how the model uses tool calls (like reading a file it doesn't have yet) to fill in the gaps in real time. …
<https://www.youtube.com/watch?v=MxG4AE72OSI>
Observer note: vertical short: presenter under the caption "The model sees request and", chat diagram labelled Anthropic API below; 5833 views at fetch; quote is the video description

### V072 · YouTube (Give Claude Persistent Memory in 5 Minutes) · creator · posted 2026-02-06 · fetched 2026-10-24 · via fetch
> One of the most annoying things about using AI to code is how it forgets everything the moment you restart it.
>
> You fix a bug, close Claude Code, come back later… and it’s like none of that work ever happened. In this video, I show how to fix that with Claude-Mem, a free, open-source plugin that lets Claude Code remember what you worked on, even after you restart it.
>
> 🔗 Relevant Links …
<https://www.youtube.com/watch?v=ryqpGVWRQxA>
Observer note: thumbnail: black ground, yellow "5 MIN FIX" block, cartoon clock with an arrow to an orange starburst; 53841 views at fetch; quote is the video description

### V073 · YouTube (I Finally Solved Claude Code's Memory  Problem) · creator · posted 2025-12-02 · fetched 2026-10-24 · via fetch
> Every Claude session starts the same way — as a blank slate.
> Everything you taught Claude about your coding style, your testing rhythm, your naming conventions… gone. It’s like “51st Dates” for developers.  ￼
>
> But that ends today. …
<https://www.youtube.com/watch?v=SlcX71SeNmA>
Observer note: thumbnail: orange pixel "CLAUDE CODE" title over green terminal text, presenter cut-out, white banner "Now Claude Knows Me"; 4434 views at fetch; quote is the video description

### V074 · YouTube (Why Claude Code forgets your rules (and the fix) #Shorts) · creator · posted 2026-10-23 · fetched 2026-10-24 · via fetch
> Told Claude Code a rule in chat? It can forget it. Long sessions get compacted: older messages become a short, lossy summary. Per Anthropic's docs, your project-root CLAUDE.md is re-read from disk after compaction, and instructions given only in conversation are one reason an instruction can disappear. Put the rules that must last in CLAUDE.md.
>
> The chat, summary and example rule shown are illustrative, not a real session. …
<https://www.youtube.com/watch?v=Wd5UZfpPpa8>
Observer note: vertical short: CLAUDE.md card listing "never create tables" and "run tests before commit", label PERSISTS, presenter below; 293 views at fetch; quote is the video description

### V075 · YouTube (Claude Code Forgets Everything (Free 1-Command Fix)) · creator · posted 2026-10-01 · fetched 2026-10-24 · via fetch
> Claude Code wipes your project, your rules and yesterday's fixes every new session. And with telemetry off, it was silently skipping your AGENTS.md. No warning. No error.
>
> Two free fixes in under a minute:
>
> Fix 1 (one line in CLAUDE.md):
> echo '@AGENTS.md'  CLAUDE.md
>
> Fix 2 (claude-mem: free, open source, 95,000+ GitHub stars):
> npx claude-mem install …
<https://www.youtube.com/watch?v=H_no5JD5D4o>
Observer note: vertical short: purple "CLAUDE CODE AMNESIA" banner over two cards, Yesterday filled and Today empty; 358 views at fetch; quote is the video description
