# TITLE

> **Layout standard**
> This is the recommended shape: chapters, then inside each chapter formulas → statements → a
> worked example, every section built from blocks. `style.js` reports how far a sheet drifts from
> it; a different structure still prints. Copy this file to start, then adapt freely.
> **Meta:** <small right-hand line of facts, no inline math; keep the header band to one line>
> **Footer:** <line printed under the columns>

# 1 · TOPIC

## ★★★ 1.1 FORMULAS AND THEOREMS

$$!CORE FORMULA$$

*Pf.* <one-line derivation>. *Meaning:* <the sentence worth reproducing in an exam answer>.

$$STANDARD FORMULA \qquad \text{(name)}$$

$$?SUPPORTING FORMULA$$

> **Trap.** <the mistake this section invites>

## ★★★ 1.2 A SECOND RESULT FAMILY

$$!RESULT$$

$$STANDARD FORMULA$$

| What you see | What it rules out | Consequence |
|---|---|---|
| <case 1> | <case 1 forbids> | <what follows> |
| <case 2> | <case 2 forbids> | <what follows> |

## ★★★ 1.3 STATEMENTS TO JUDGE (one line each)

- <claim> — ==keyword== so the line is findable.
- <claim> — ==keyword==.
- <claim> — ==keyword==.
- <claim> — ==keyword==.
- <claim> — ==keyword==.

## ★★★ 1.4 2024 Q2 — <short title> (12 marks)

*Q.* <question stem, with the numbers of the original paper>.

- (a) <the formula used, then the numbers substituted>.
- (b) <step>.
- (c) <step>.

> **Key** — <the one sentence that earns the marks>.

# 2 · TOPIC

## ★★★ 2.1 FORMULAS AND THEOREMS

$$!CORE FORMULA$$

$$STANDARD FORMULA$$

$$?SUPPORTING FORMULA$$

- <the one fact that does not fit a formula box>.

## ★★ 2.2 A SECOND RESULT

$$!RESULT$$

*Meaning:* <one sentence>.

## ★★★ 2.3 STATEMENTS TO JUDGE (one line each)

- <claim> — ==keyword==.
- <claim> — ==keyword==.
- <claim> — ==keyword==.

## ★★★ 2.4 2023 Q4 — <short title> (10 marks)

*Q.* <stem>.

- (a) <step>.
- (b) <step>.

> **Key** — <the sentence>.

<!--
Self-check before rendering - every box must be ticked:
  [ ] ONLY chapters use "#" (plus the title): no "# Appendix", "# Quiz", "# Extra" after the last
      chapter - they render as chapter bars and read as filler
  [ ] every chapter carries: formula sections (>= 6 blocks), its own STATEMENTS section (5-7 lines,
      ==keywords==), and 1-2 WORKED EXAMPLES with the numbers substituted
  [ ] every section heading carries a star run, numbering N.M with N = its chapter, M sequential
  [ ] chapter order follows the syllabus; INSIDE a chapter it is formulas -> statements -> example
  [ ] every section is made of blocks ($$ formulas, tables, bullets) - no section is a paragraph
  [ ] 60-76% of the sections are ★★★; ★★ is a second-tier result, ★ exists, ☆ is context
  [ ] Meta / Footer lines exist; the header band is ONE line
  [ ] every formula fits inside ONE column; split at an "=" if it does not
  [ ] no \| inside a table row (use \mid or \lVert)
  [ ] emphasis may span inline math; it may NOT span a blank line
  [ ] build in rounds: coverage first (all formulas), then statements + one example per chapter,
      then measure (the --audit table), then deepen the thin chapter - never append filler
  [ ] layout knobs are free: --cols/--base/--gap may be passed; the defaults reproduce the specimen
  [ ] colour/boxes/dividers/typeface are theme tokens: leave them alone unless you also pass
      --theme=any, which tells the checks the new look is deliberate
  [ ] 20-35 KB of Markdown for two pages; prose was cut before formulas
-->
