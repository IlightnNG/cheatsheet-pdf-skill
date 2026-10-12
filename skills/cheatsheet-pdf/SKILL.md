---
name: cheatsheet-pdf
description: Turn lecture notes, slides or past papers into an A4 cheat sheet PDF of one or more pages (default two, double-sided). Use when the user asks for a cheat sheet, formula sheet, crib sheet, or "one page of formulas" for an exam. Covers evidence-based topic rating, Markdown authoring conventions, and a one-command renderer that fits the content to the requested page count.
---

# Cheat sheet PDF (one A4 page)

Two stages. You author the Markdown; one command renders and checks it.

- **A. Author** `<name>.md`, starting from `skills/cheatsheet-pdf/templates/sheet-master.md`.
- **B. Render** it: `cheatsheet.js` fits it to the requested pages, `verify.js` checks the result.

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

### Choosing what goes in

1. **Keep the teaching order.** Never reorder by importance — the star ratings carry the priority
   signal, and a chapter-ordered sheet is far easier to study from.
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

### Compression order

When it does not fit — stop as soon as it fits:

1. prose that restates the formula,
2. sentences about why a result matters (keep `*Meaning:*`),
3. second sentences inside proof sketches (keep the step the examiner asks for),
4. off-syllabus enrichment.

**Never** delete a formula block, and never the proof step the examiner asks for.

### Two Markdown hazards

- **Never write `\|` inside a table row** — it is the cell separator. Use `\mid` or `\lVert`.
- **Math stars are superscripts**: `A^*` is not emphasis. Never let a `*…*` pair span a formula.

**Checkpoint.** Show the Markdown to the user — sections, star ratings, and what you cut — and
wait for approval before rendering. Skip only if the user asks for a quick one-shot result.

## Stage B — render

```bash
node skills/cheatsheet-pdf/scripts/cheatsheet.js <name>.md <name>.pdf --cols=5 --pages=2
node skills/cheatsheet-pdf/scripts/verify.js <name>.pdf
```

Flags: `--cols=<n>` columns · `--pages=<n>` pages to fill (**default 2**) · `--base=<pt>` prose
size · `--gap=<mm>` gutter · `--math=<em>` math size relative to prose · `--no-print` measure
only · `--thin=<pt>` printed hairline thickness · `--quiet` · `--help` · `--version`. Defaults come
from the stylesheet (2 pages, 6 columns, 5.5 pt); a run prints the settings it used on its first
lines.

**Do not search the dials blindly.** Start at `--cols=5`, run once, and act on the `ADVICE:` lines
that `measure` prints:

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

1. Every past-paper topic appears somewhere on the page.
2. The three tiers are visibly used — a reader can tell in five seconds what must be memorised.
3. Every `★★★` formula has a derivation line or a `*Meaning:*`.
4. `verify.js` reports 9/9 PASS.
5. **Look at the rendered page**, not just the gate report: the header is not clipped, no formula
   broke mid-way, the last column does not run off the page, and no heading is stranded at the
   bottom of a column. `node skills/cheatsheet-pdf/scripts/tools/diag.js <out.png>` writes a
   full-page preview — one is normally enough; crop only if something looks wrong.
6. Nothing was cut merely to make the type bigger.

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
