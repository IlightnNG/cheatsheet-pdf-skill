---
name: cheatsheet-pdf
description: Turn lecture notes, slides or past papers into an A4 cheat sheet PDF of one or more pages (default two, double-sided). Use when the user asks for a cheat sheet, formula sheet, crib sheet, or "one page of formulas" for an exam. Covers evidence-based topic rating, Markdown authoring conventions, and a one-command renderer that fits the content to the requested page count.
---

# Cheat sheet PDF (one or two A4 pages)

Two stages. You author the Markdown; one command renders and checks it.

- **0. Check the machine** (once): `node skills/cheatsheet-pdf/scripts/doctor.js --smoke` verifies
  node, Chrome and the temp dir, then renders the bundled regression sheet end to end.
- **A. Author** `<name>.md`, starting from `skills/cheatsheet-pdf/templates/sheet-master.md`.
- **B. Render** it: `cheatsheet.js` lints, fits it to the requested pages, and prints it;
  `verify.js` checks the result.

The hard part is **capacity**, not markup: a fixed page area must hold an elastic amount of
content. A good sheet comes from choosing well and then fitting it — in that order.

**Write for the page count.** Default **2 pages** (double-sided A4); `--pages=<n>` changes it. A
full page is roughly 15–25 KB of Markdown at 4–5 columns, so budget that per page and let the
`ADVICE:` lines correct you. Content that does not fit is reported with the amount to cut and which
low-priority sections to cut first — the printer must never clip in silence.

**Run the scripts; do not read them.** They are tools, not reference material: calling
`cheatsheet.js` and `verify.js` is the whole interface. Reading the implementation wastes your
context and changes nothing about the output. Everything you need is on this page.

Use for "A4 cheat sheet", "crib sheet", "all the formulas on one page or two". Not for long
summaries, slide decks, or anything that must stay prose.

## Stage A — author the Markdown

Copy `skills/cheatsheet-pdf/templates/sheet-master.md` and fill it in; it carries the format
conventions, so do not invent a different layout. Every line below is one module with one job:
write the subject, never a record of how you chose it.

| Write | Renders as |
|---|---|
| `# Title` | header title (keep it short: the header band is one line) |
| `> **Meta:** …` | the short right-hand note in the header |
| `> **Footer:** …` | the line under the columns |
| `> **Header:** …` | optional 2–4 word subtitle; a long one wraps the note and eats column height |
| `# 1 · Topic` | chapter bar |
| `## ★★★ 1.1 Section` | section; the star run sets the colour, never the size |
| `### Sub-part` | small red sub-heading |
| `$$!formula$$` | core result — pink box, largest math |
| `$$formula$$` | standard formula — blue box |
| `$$?formula$$` | supporting formula — grey box, smallest math |
| `$x$` | inline math in prose |
| `*Pf.* …` / `*Meaning:* …` | proof sketch / the sentence worth reproducing in an exam answer |
| `> **Trap.** …` | warning box |
| `- item` / `1. item` | bullet list / numbered list |
| `\| a \| b \|` | table — 0.92 em, cannot split across a column |
| `**bold**` / `*italic*` | emphasis — works across inline math (`**BSC$(\epsilon)$**` is fine) and inside table cells |
| `==keyword==` | yellow highlight; use it for the 1–2 search keywords of a "statements" line |
| `` `code` `` | grey monospace chip (identifiers, file names) |

### What does NOT render

Everything else is printed literally, so the linter fails the build instead: `__bold__`, `~~strike~~`,
raw `<span style=…>`, `\textbf{…}` outside math, and box-drawing characters (`─ │ ┌`) or thin arrows
inside `` `code` `` — the embedded fonts have no glyph, so a hand-drawn diagram silently loses its
strokes. Draw a channel diagram with `\xrightarrow` inside a display block instead:

```markdown
$$0\xrightarrow{\ 1-\epsilon\ }0\qquad 0\xrightarrow{\ \epsilon\ }1$$
```

The lint stage (`LINT ERROR …`) blocks the print; warnings are advice, not failures.

### The visual identity (enforced — `theme.js` runs on every render)

Content is yours; the **look** is not. `lib/theme.js` pins the twenty tokens that make the page
recognisable and `verify.js` gates them:

| Token | Value |
|---|---|
| body typeface | Cambria / Georgia / Times New Roman, serif |
| ★★★ / ★★ / ★ / ☆ section bars | `#b02020` / `#0d6b3a` / `#5a6a7a` / `#e2e6ea` |
| core formula box `.fxc` | fill `#fdeaea`, left rule `1.7pt solid #b02020` |
| standard box `.fxd` | fill `#eef3fb`, left rule `1.3pt solid #1a3a6b` |
| supporting box `.fxs` | fill `#f6f7f8`, left rule `0.8pt solid #c3c9cf` |
| trap / quote box `.q` | fill `#fffaf0`, left rule `0.9pt solid #c07000` |
| header rule | `1.2pt solid #1a3a6b` |
| `code` / `mark` | `#eef1f5` / `#ffe9a4` |

Want a different look? Edit those rules in `sheet.css` (or ship a `--css` overlay), then run with
`--theme=any` and `verify.js --theme=any`. `node skills/cheatsheet-pdf/scripts/lib/theme.js` prints
exactly which token differs. **Layout** (columns, base size, margins, paper) is not a theme token —
those flags are free for anyone to change.

### The shape (recommended — `style.js` advises)



A sheet is **chapters of sections, and every section is a stack of blocks**. The reference specimen
is [`examples/information-theory.md`](../examples/information-theory.md) (8 chapters, 59 sections,
2 pages). These rules are **advice**: follow them and the page reads like the specimen; ignore them
and it still prints. `--strict-style` turns them into errors when a team must match exactly.

| Rule | Value | Advice |
|---|---|---|
| Chapters | `# N · Title`, N = 1..K, no gaps | advice |
| Sections | `## ★★★ N.M Title`, M sequential inside its chapter | advice |
| Section content | ≥ 1 block (`$$` formula, table or bullets) rather than paragraphs | advice |
| Order inside a chapter | formulas/theorems → statements → past-paper questions | advice |
| ★★★ share | 60–76 % of sections (reference 76 %) | advice |
| Formula blocks per section | 3–9 (reference average 3.6) | advice |
| Statements section | one per chapter, 5–7 bullets, 1–2 `==keywords==` each | advice |
| Past-paper section | 1–2 per chapter, title carries `(N marks)`, ≤ 3 formula blocks | advice |
| Section size | ≤ 2200 characters (reference ≈ 670) | advice |

**Layout is yours.** The defaults (`--cols=5`, `--base=auto`, 5 mm margins, A4 landscape, 2 pages)
reproduce the specimen, and `--base=auto` is what makes the same Markdown land on the same page
anywhere. If you want a denser or airier page, pass `--cols`/`--base`/`--gap` freely - only the
theme is locked.

### What every chapter contains (the skeleton)

A chapter is not "some text"; it is a fixed stack of blocks, and **the statements and the example
live inside the chapter they belong to** — never in one block after the last chapter:

```markdown
# 3 · Hypothesis testing (Ch.3)

## ★★★ 3.1 Formulas and theorems          <- ≥ 6 blocks, one formula per $$ block
## ★★★ 3.2 A second result family         <- as many formula sections as the topic needs
## ★★★ 3.3 Statements to judge (one line each)   <- 5-7 single-line claims, each with ==keyword==
## ★★★ 3.4 2024 Q2 — Neyman-Pearson on a table (12 marks)   <- worked example, numbers, bullets
```

| Block | Required | Target |
|---|---|---|
| formula / theorem sections | yes | ≥ 6 formula blocks per chapter, split into 2–4 sections |
| `Statements to judge` | yes | exactly one per chapter, 5–7 one-line claims |
| worked example | yes | 1–2 per chapter: a past paper (`20xx Qn — title (N marks)`) and/or a **drill** (`Worked example — <topic> with numbers`): one dataset, several formulas, substituted values in a table |
| header facts (`> **Meta:**`) | yes | one line |

**Only a chapter may use `#`.** `# Appendix`, `# Quiz corner`, `# Extra practice`, `# Summary` all
render as chapter bars, so the sheet grows a second half that looks like filler — and it is filler.
If a topic does not fit, it belongs in a chapter; if it does not belong to a chapter, drop it.
`lint.js` fails the build on a top-level heading that is not `# N ·`.

### Two kinds of example (both belong in a chapter)

A past-paper question proves the topic was examined; a **drill** teaches the arithmetic. They are
not the same shape, and the drill is the denser of the two:

| Kind | Title | Shape |
|---|---|---|
| past paper | `20xx Qn — <topic> (N marks)` | the original parts, one `> **Key**` |
| **drill** | `Worked example — <topic> with numbers` | **one dataset, several related formulas in a row**, no parts, no theory |

A drill is a **class of computation**, not a single question: hand it one table or matrix and walk
*all* the formulas of the section on that data. That is what raises formula coverage while using
less space than a second exam question.

```markdown
## ★★★ 1.6 Worked example — four entropies on one joint table

*Data.* P_XY: (0,0)=1/2, (0,1)=1/4, (1,0)=1/4, (1,1)=0.

| formula | with the numbers | value |
|---|---|---|
| P_X, P_Y | column/row sums | (3/4, 1/4) |
| H(X) = -Σ p log p | -(3/4 log 3/4 + 1/4 log 1/4) | 0.811 |
| H(XY) | 1/2·1 + 2·(1/4·2) | 1.500 |
| I(X:Y) = H(X)+H(Y)-H(XY) | 0.811 + 0.811 - 1.500 | 0.123 |
| H_min(X|Y) = -log p_guess | p_guess = 3/4·2/3 + 1/4·1 | 0.415 |
```

Rules that make it worth the space:

- **one dataset for the whole drill** — a table or a matrix at the top, then every formula reads
  from it; a second dataset doubles the space and teaches nothing new;
- **numbers that divide cleanly** (halves, quarters, 2^n) so the reader can follow without a
  calculator; write the intermediate value, never just the answer;
- **end with the formula an exam would actually ask for** (here `I(X:Y)`), so the last line is the
  one to remember;
- 4–6 formulas in a drill is normal; prose is capped at the one-line *Data.* and a trailing
  sanity check ("at ε = 1/2 the capacity is 0, as expected").
- a drill **must contain data**: `style.js` reports one that carries almost no numbers.

### Priority when the page is full

The three block types have a fixed priority; when the sheet overflows, cut from the bottom:

| Rank | Block | When cutting |
|---|---|---|
| 1 | formulas and theorems (`$$`, tables of cases) | never cut; shorten prose around them |
| 2 | worked examples (past paper and drill) | keep the substitution steps; cut the framing sentence |
| 3 | `Statements to judge` | **cut first**: drop the least examinable lines, or shorten each to one clause |

`paginate-pages.js` prints the same order in its `ADVICE:` line, and the section-level candidates it
lists are ranked by star, so a `★` statements section is the first thing it suggests.

### Work in rounds, never in one pass

The first draft is never the sheet. Four rounds, each with a different question:

1. **Coverage.** List the examinable topics from the syllabus and the past papers. Write the formula
   sections for *all* of them — one `$$` block per formula, no prose, no examples yet. Do not think
   about page count; a thin first draft is a planning error, a long one is fine.
2. **Per chapter: statements + example.** Add the 5–7 statements and one worked example to every
   chapter. The example must carry the numbers of a real question and show each substitution, not
   just the answer.
3. **Measure, then deepen.** Render with `--no-print` or run `--audit` and read the coverage table
   (`sections formulas stmt example chars`). The row that is below target is the one to expand —
   inside that chapter: more theorems, a second example, the derivation line the proof needs.
   **Never** append new top-level content to fill the page.
4. **Trim to the page budget.** Only now cut: prose that restates a formula, then ☆/★ blocks, never
   a `★★★` formula and never the step an exam answer needs.

The rule of thumb: **if a page is short, the fix is inside a chapter; if it overflows, the fix is
also inside a chapter.** A chapter that ends up thin is a chapter that will be thin on the exam
paper too.

### Choosing what goes in

1. **Rate by evidence, not intuition.** Count how often a topic appears across the past papers and
   how many marks it carries. High frequency *and* high marks → `★★★`. Recurs reliably → `★★`. In
   scope but never yet examined → `★` (the "predicted new question" band). Context only → `☆`.
2. **Aim at 76 / 19 / 5.** The reference sheet is 76 % `★★★`, 19 % `★★`, 5 % `★`. A sheet where
   everything is `★★★` has no priorities; a sheet with no `★★★` has no answers — `style.js` warns
   outside 60–76 %.
3. **Depth by tier**: `★★★` gets the formula *plus* one line of derivation or `*Meaning:*`; `★★`
   gets the formula and its name; `★` the statement only; `☆` one line.
4. **Cover every examined topic**, even thinly. A topic that appeared in past papers must appear
   somewhere — as a formula box, or at minimum a `☆` line. Never trade a topic away for a larger
   font: cut prose instead.
5. **A judgement table belongs in the formula part**, not buried in a worked example. If a rule has
   cases (`d=1` when a column is zero, `d≥2` without a zero column, …), give it its own `$$`/table
   block under the chapter's formulas, then let the example refer to it.

### Compression order

When it does not fit — stop as soon as it fits, and cut in this order:

1. **statement lines** — the lowest priority block: drop the least examinable claims, or shorten each
   to one clause (a judgement line is worth less than the formula or example it refers to),
2. prose that restates the formula,
3. sentences about why a result matters (keep `*Meaning:*`),
4. second sentences inside proof sketches (keep the step the examiner asks for),
5. off-syllabus enrichment.

**Never** delete a formula block, and never the substitution step of a worked example. A drill may
lose its *Scenario* sentence, not its arithmetic.

### Two Markdown hazards

- **Never write `\|` inside a table row** — it is the cell separator. Use `\mid` or `\lVert`.
- **Do not put a blank line inside `**bold**`** — the emphasis is applied per line, so an open pair
  leaks its asterisks. Spanning inline math is fine (`**BSC$(\epsilon)$**` renders bold).

**Checkpoint.** Show the Markdown to the user — sections, star ratings, and what you cut — and
wait for approval before rendering. Skip only if the user asks for a quick one-shot result.

## Stage B — render

```bash
node skills/cheatsheet-pdf/scripts/cheatsheet.js <name>.md <name>.pdf --cols=5 --pages=2
node skills/cheatsheet-pdf/scripts/verify.js <name>.pdf
```

Layout flags (free for anyone to use):

| Flag | Meaning | Default |
|---|---|---|
| `--pages=<n>` | pages to fill; `1` for a single sheet | 2 |
| `--cols=<n>` | columns | 5 |
| `--base=<pt>` | prose size; `auto` = largest that fills the pages, `css` = stylesheet value | auto |
| `--gap=<mm>` | column gutter | 1.9 |
| `--math=<em>` | math size relative to prose | from stylesheet |
| `--css=<file>` | stylesheet overlay (portrait paper, a custom palette) | off |
| `--thin=<pt>` | printed hairline thickness; `0` disables | 0.25 |
| `--no-print` | measure only, no PDF | off |

Pipeline flags:

| Flag | Meaning |
|---|---|
| `--lint` | the static checks only (lint + shape advice); no PDF, no browser |
| `--audit` | print the chapter/section/past-paper structure, then exit |
| `--strict-style` | make the shape advice fatal (team/classroom mode) |
| `--no-style` | skip the shape report entirely |
| `--theme=any` | declare a custom palette; the theme check then only reports |
| `--renumber` | render from a renumbered copy (the master is never edited) |
| `--preview[=N]` | write `<out>.pN.png` so a human can look at page N |
| `--fill=<pct>` | flag a page emptier than this (85 % by default on multi-page) |
| `--quiet` | warnings and the final summary only |

A run prints the knobs it used on its first lines, and the stamps are recorded in
`.cheatsheet/build.json` so `verify.js` can tell you when you are verifying the wrong build.

Three stages run before the PDF is written:

- **lint** — `LINT ERROR` (literal `**`, a missing glyph, a numbering gap, the same past-paper
  question answered twice) stops the build; `LINT WARN` is advice.
- **style** — `STYLE WARN` says how far the sheet drifts from the specimen (chapters, section order,
  blocks, star mix). It never stops a build unless you pass `--strict-style`.
- **theme** — twenty colour/typeface tokens are compared with the reference sheet. A drift stops the
  build until you pass `--theme=any`, which is how a deliberate restyle declares itself.

**If the build stops, the message names the fix.** Do not edit the stylesheet, and do not delete the
offending content: `--base=auto` is a *consequence* of too much content, not a cause.

| Message | Fix |
|---|---|
| `Chrome/Chromium not found` | set `CHROME_PATH`; `doctor.js` prints the path it tried |
| `lint found errors` (`markup`) | `**…**` spans a blank line — keep the pair on one line |
| `lint found errors` (`glyph`) | a `─ │ →` sits outside math — use `\xrightarrow` in a `$$` block |
| `lint found errors` (`structure`) | section numbers drifted — add `--renumber` |
| `lint found errors` (`duplicate`) | the same past-paper question twice — merge, or split with `(a)(b)` markers |
| `STYLE WARN shape` | a section with no `$$`/table/bullet — it prints, it just will not look like the specimen |
| `STYLE WARN order` | a formula section after the statements/past papers — the specimen puts them first |
| `STYLE ERROR …` | only with `--strict-style`; without it every shape problem is advice |
| `KaTeX could not typeset every formula` | an unbalanced brace or a trailing `\` in a `$$` block |
| `the content needs more than N page(s)` | `--base=auto`, cut in the documented order, or `--pages=N+1` |
| `verify: … is the build for "x.pdf", not "y.pdf"` | one `.cheatsheet/` per folder — re-render, or `--work=<dir>` |

**First run on a new machine:** `node skills/cheatsheet-pdf/scripts/doctor.js --smoke` checks node,
Chrome and the temp dir, then renders the regression example end to end.

**Changing the conventions?** Run `npm run test:guards` first (about a second): it asserts that the
top-level-heading rule, the markup rules and the per-chapter skeleton still fire on the fixtures in
`examples/fixtures/`. `npm test` is the slow layer that renders four sheets and runs every gate.

**Do not search the dials blindly.** Start with the defaults (landscape A4, 5 columns, 2 pages, 5 mm
margins), add `--base=auto` when the page count must be hit exactly, run once, and act on the
`ADVICE:` lines that `measure` prints:

- *"fill it with --cols=K … or --base=B"* → pick one and re-run. The column route is exact for a
  formula-heavy sheet; the type route always works but also widens every formula.
- *"needs exactly one more column"* → `--cols` as stated. *"needs far more columns"* → lower
  `--base` substantially instead; do not set `--cols` to the number quoted there.
- *"content is thin for one page"* → the material does not fill a page. Add topics rather than
  inflating the type.
- *"content does not fit N page(s)"* → cut in the documented order (☆/★ before ★★, never a `★★★`
  formula) and re-render, or raise `--pages`. *"N page(s) requested, M with content"* → under
  budget: add examined topics or lower `--pages`; never inflate `--base` to fill pages.
- *"good fit"* / *"every page is well filled"* → print it.
Two passes converge. Sweeping twenty combinations means the advice was ignored.

- `verify.js` must report every gate as PASS. If a gate fails, fix the **Markdown** — do not edit
  the stylesheet.
- `--split` switches on an experimental line-breaking mode; the default (one formula per line) is
  safer and is what you want unless long formulas dominate.

## Before you deliver

1. `--lint` reports **0 errors** (a literal `**`, a glyph the font lacks, a numbering gap, a
   duplicated past-paper question) and **`STYLE` 0 errors** (chapters, section order, blocks instead
   of paragraphs).
2. `--audit` shows chapters 1..N in order, sections numbering without gaps, each past-paper question
   once (a question split across two chapters must say so in its titles, e.g. `2023 Q2 (a)(b) —
   source part` / `2023 Q2 (c)(d) — extraction`), and no top-level heading that is not a chapter.
3. Every past-paper topic appears somewhere on the page, and **every chapter has its own
   statements section and at least one worked example** — `--audit` prints one row per chapter with
   `sections formulas stmt example chars`, so a thin chapter is visible before the PDF exists.
4. The three tiers are visibly used — a reader can tell in five seconds what must be memorised.
5. Every `★★★` formula has a derivation line or a `*Meaning:*`.
6. `verify.js` reports 12/12 PASS (the theme gate needs `--theme=any` when you changed the palette on purpose). On a multi-page sheet the relevant capacity gate is *"no page over
   its column budget"*; the flow-width number in the detail line is expected to exceed one page.
7. **Look at the rendered page** (`--preview` writes `out.p1.png`, `--preview=2` writes `out.p2.png`).
   The gates measure geometry; they cannot see a glyph that failed to embed or a highlight that did
   nothing.
8. Nothing was cut merely to make the type bigger.

## Two things that are easy to get wrong

1. **A formula box is atomic.** One wider than its column cannot break, so it overflows: split it
   into two `$$` blocks at an `=`, or shorten it. A box that is still too wide is scaled down
   automatically (`scaled 6: 83%, 72%, …`), and "needs under 72%" means shorten it in the Markdown.
   Inline `$…$` is never scaled, so keep it short — a long one bleeds into the next column.
2. **Tables cannot split.** Keep them to 2–3 columns and few rows, or they waste the rest of a
   column.

## Reference

- `skills/cheatsheet-pdf/templates/sheet-master.md` — copy this; it carries the conventions.
- `examples/information-theory.md` — **the reference specimen**: 8 chapters, 59 sections, 213 formula
  blocks, 11 past-paper questions, 2 pages. When a shape question is not answered above, this file
  answers it.
- `examples/regression.md` — every parser, linter and style guard as an executable assertion.
- `skills/cheatsheet-pdf/scripts/sheet.css` — the whole look in one file; the tokens that must not
  drift are listed in `scripts/lib/theme.js`.
- `examples/demo.md` — a small one-page sheet (~5 KB) when you want a minimal example.
