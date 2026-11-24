# TITLE

> **Layout standard**
> This is the recommended shape: chapters, then inside each chapter formulas → statements → worked
> examples. `style.js` reports how far a sheet drifts from it; a different structure still prints.
> Copy this file to start, then adapt freely.
> **Meta:** <small right-hand line of facts, no inline math; keep the header band to one line>
> **Footer:** <line printed under the columns>

# 1 · TOPIC

## ★★★ 1.1 FORMULAS AND THEOREMS

$$!CORE FORMULA$$

*Pf.* <one-line derivation>. *Meaning:* ==<name of the result>== — <the sentence worth reproducing in an exam answer>.

$$STANDARD FORMULA \qquad \text{(<name>)}

$$?SUPPORTING FORMULA$$

> **Trap.** <the mistake this section invites>

## ★★★ 1.2 A SECOND RESULT FAMILY

$$!RESULT$$

*Meaning:* ==<name>== — <one sentence>.

| What you see | What it rules out | Consequence |
|---|---|---|
| <case 1> | <case 1 forbids> | <what follows> |
| <case 2> | <case 2 forbids> | <what follows> |

## ★★★ 1.3 STATEMENTS TO JUDGE (one line each)

- <claim> — ==<keyword>== so the line is findable.
- <claim> — ==<keyword>==.
- <claim> — ==<keyword>==.
- <claim> — ==<keyword>==.
- <claim> — ==<keyword>==.

## ★★★ 1.4 2024 Q2 — <short title> (12 marks)

*Q.* <question stem, with the numbers of the original paper>.

- (a) <the formula used, then the numbers substituted>.
- (b) <step>.
- (c) <step>.

> **Key** — <the one sentence that earns the marks>.

## ★★★ 1.5 Worked example — <topic> with numbers

*Data.* <one line: the distribution, matrix or channel the drill uses>.

- <formula 1> $= <substitution> = <value>$
- <formula 2> $= <substitution> = <value>$
- <formula 3> $= <substitution> = <value>$  ← the one an exam would ask for

# 2 · TOPIC

## ★★★ 2.1 FORMULAS AND THEOREMS

$$!CORE FORMULA$$

*Meaning:* ==<name>== — <one sentence>.

$$STANDARD FORMULA$$

$$?SUPPORTING FORMULA$$

- <the one fact that does not fit a formula box>.

## ★★★ 2.2 STATEMENTS TO JUDGE (one line each)

- <claim> — ==<keyword>==.
- <claim> — ==<keyword>==.
- <claim> — ==<keyword>==.

## ★★★ 2.3 2023 Q4 — <short title> (10 marks)

*Q.* <stem>.

- (a) <step>.
- (b) <step>.

> **Key** — <the sentence>.

## ★★★ 2.4 Worked example — <second scenario> with numbers

*Data.* <one line: the numbers the drill uses, e.g. n = 7, d = 3>.

- <formula A> $= <numbers> = 0.5$
- <formula B> $= <numbers> = 1.5$
- Check: <a known special case> $= 0$

<!--
Self-check before rendering - every box must be ticked:
  [ ] ONLY chapters use "#" (plus the title): no "# Appendix", "# Quiz", "# Extra" after the last
      chapter - they render as chapter bars and read as filler
  [ ] every chapter carries: formula sections (>= 6 blocks), its own STATEMENTS section (5-7 lines,
      ==keywords==), and 1-3 worked examples with the numbers substituted
  [ ] the formula/theorem NAMES are highlighted with ==name== inside the knowledge sections (not
      only in the statements list) - that is how a reader finds them while scanning
  [ ] drills are PLAIN TEXT, not tables: one *Data.* line, then each formula as a chained equality
      (formula = substitution = value). A table cannot split across a column and costs the layout.
  [ ] drill only the formulas that are important AND examinable; 3-6 lines each, several small
      drills beat one long one
  [ ] exam sections stay short too: the parts, the numbers, one > **Key**
  [ ] every section heading carries a star run, numbering N.M with N = its chapter, M sequential
  [ ] chapter order follows the syllabus; INSIDE a chapter it is formulas -> statements -> examples
  [ ] every section is made of blocks ($$ formulas, tables, bullets) - no section is a paragraph
  [ ] 60-76% of the sections are ★★★; ★★ is a second-tier result, ★ exists, ☆ is context
  [ ] Meta / Footer lines exist; the header band is ONE line
  [ ] every formula fits inside ONE column; split at an "=" if it does not
  [ ] no \| inside a table row (use \mid or \lVert)
  [ ] emphasis may span inline math; it may NOT span a blank line
  [ ] build in rounds: coverage first (all formulas), then statements + examples per chapter,
      then measure (the --audit table), then deepen the thin chapter - never append filler
  [ ] when the page overflows, cut STATEMENTS first, then prose; never a formula or a drill step
  [ ] layout knobs are free: --cols/--base/--gap may be passed; the defaults reproduce the specimen
  [ ] colour/boxes/dividers/typeface are theme tokens: leave them alone unless you also pass
      --theme=any, which tells the checks the new look is deliberate
  [ ] 20-35 KB of Markdown for two pages; prose was cut before formulas
-->
