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

### Choosing what goes in

1. **Chapter order, then type order.** Keep the syllabus order of chapters (a chapter-ordered sheet
   is what you study from). Inside each chapter write the blocks in this order, because that is the
   order an exam question uses them:
   1. **formulas and theorems** (§N.1 “Formulas”, one formula per `$$` block),
   2. **statements to judge** — the short TRUE/FALSE lines, each with `==keyword==`,
   3. **past-paper questions**, as `## ★★★ N.k 20xx Qn — title (marks)` with the data and the steps.
   A chapter with no past-paper question keeps 1–2 only.
2. **Rate by evidence, not intuition.** Count how often a topic appears across the past papers and
   how many marks it carries. High frequency *and* high marks → `★★★`. Recurs reliably → `★★`. In
   scope but never yet examined → `★` (the "predicted new question" band). Context only → `☆`.
3. **Spend the page roughly 60 / 25 / 15.** About 60 % of the blocks `★★★`, 25 % `★★`, the rest
   `★`/`☆`. A sheet where everything is `★★★` has no priorities; a sheet with no `★★★` has no
   answers.
4. **Depth by tier**: `★★★` gets the formula *plus* one line of derivation or `*Meaning:*`; `★★`
   gets the formula and its name; `★` the statement only; `☆` one line.
5. **Cover every examined topic**, even thinly. A topic that appeared in past papers must appear
   somewhere — as a formula box, or at minimum a `☆` line. Never trade a topic away for a larger
   font: cut prose instead.
6. **A judgement table belongs in the formula part**, not buried in a worked example. If a rule has
   cases (`d=1` when a column is zero, `d≥2` without a zero column, …), give it its own `$$`/table
   block under the chapter's formulas, then let the example refer to it.

### Compression order

When it does not fit — stop as soon as it fits:

1. prose that restates the formula,
2. sentences about why a result matters (keep `*Meaning:*`),
3. second sentences inside proof sketches (keep the step the examiner asks for),
4. off-syllabus enrichment.

**Never** delete a formula block, and never the proof step the examiner asks for.

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

Flags: `--cols=<n>` columns · `--pages=<n>` pages to fill (**default 2**) · `--base=<pt>` prose size
(`--base=auto` searches for the largest size that still fits) · `--gap=<mm>` gutter · `--math=<em>`
math size relative to prose · `--no-print` measure only · `--lint` static checks only (no PDF) ·
`--audit` print the chapter/section/question structure · `--renumber` render from a renumbered copy
· `--preview[=N]` write `<out>.pN.png` · `--fill=<pct>` warn about a page emptier than this ·
`--thin=<pt>` hairline thickness · `--quiet` · `--help` · `--version`. Defaults come from the
stylesheet (2 pages, 5 columns, 5.5 pt, 5 mm margins); a run prints the settings it used on its first lines.

The first three stages are automatic and non-negotiable:

- **lint** runs before anything is printed. `LINT ERROR` (literal `**`, a missing glyph, a numbering
  gap, the same past-paper question answered twice) stops the build; `LINT WARN` is advice.
- **`--base=auto`** is the sane default when a page count must be hit exactly: 5.5 pt and 5.4 pt can
  differ by a whole page, and the search reports the largest size that fits.
- **`--fill=90`** turns "page 2 is half empty" into an `ADVICE:` line, which is wasted paper, not a
  layout defect.

**If the build stops, the message names the fix.** Do not edit the stylesheet, and do not delete the
offending content: `--base=auto` is a *consequence* of too much content, not a cause.

| Message | Fix |
|---|---|
| `Chrome/Chromium not found` | set `CHROME_PATH`; `doctor.js` prints the path it tried |
| `lint found errors` (`markup`) | `**…**` spans a blank line — keep the pair on one line |
| `lint found errors` (`glyph`) | a `─ │ →` sits outside math — use `\xrightarrow` in a `$$` block |
| `lint found errors` (`structure`) | section numbers drifted — add `--renumber` |
| `lint found errors` (`duplicate`) | the same past-paper question twice — merge, or split with `(a)(b)` markers |
| `KaTeX could not typeset every formula` | an unbalanced brace or a trailing `\` in a `$$` block |
| `the content needs more than N page(s)` | `--base=auto`, cut in the documented order, or `--pages=N+1` |
| `verify: … is the build for "x.pdf", not "y.pdf"` | one `.cheatsheet/` per folder — re-render, or `--work=<dir>` |

**First run on a new machine:** `node skills/cheatsheet-pdf/scripts/doctor.js --smoke` checks node,
Chrome and the temp dir, then renders the regression example end to end.

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
   duplicated past-paper question).
2. `--audit` shows chapters 1..N in order, sections numbering without gaps, and each past-paper
   question once (a question split across two chapters must say so in its titles, e.g.
   `2023 Q2 (a)(b) — source part` / `2023 Q2 (c)(d) — extraction`).
3. Every past-paper topic appears somewhere on the page.
4. The three tiers are visibly used — a reader can tell in five seconds what must be memorised.
5. Every `★★★` formula has a derivation line or a `*Meaning:*`.
6. `verify.js` reports 11/11 PASS. On a multi-page sheet the relevant capacity gate is *"no page over
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
- `examples/demo.md` — a finished sheet (~5 KB) with those conventions applied.
