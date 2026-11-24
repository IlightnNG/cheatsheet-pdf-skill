# Fixtures

Inputs for `skills/cheatsheet-pdf/scripts/tests/guards.js`. **Do not "fix" them**: each one is
wrong on purpose, and the point of the test is that the guard still catches it.

| File | What it is | What must happen |
|---|---|---|
| `good.md` | the smallest sheet that satisfies the skeleton | lint 0 errors, style 0 errors |
| `appendix.md` | ends with a top-level `# Appendix` | `LINT ERROR top-level` |
| `skewed.md` | all statements in one block after the last chapter | `STYLE WARN skeleton` (advice), `STYLE ERROR` with `--strict-style` |
| `markup.md` | `__bold__`, `~~strike~~`, a box-drawing stroke, an escaped table pipe | four `LINT ERROR`s |
| `exams-only.md` | a past paper but no formula drill | `STYLE WARN skeleton ... no formula drill` |
| `drill-prose.md` | a "drill" that is a prose recap with no data | `STYLE WARN skeleton ... carries almost no numbers` |
| `drill-table.md` | a drill laid out as a table | `STYLE WARN shape ... is built on a table` |
| `drill-duplicate.md` | a drill that recomputes the exam's formula | `STYLE WARN duplicate ... repeats formula(s)` |

Run them with `npm run test:guards` (about a second, no browser).

`cjk.md` is a manual check that Chinese text renders and embeds: `npm run demo:cjk` writes
`examples/fixtures/cjk.pdf`; the fonts it embeds are Microsoft YaHei / SimSun subsets, so the file
stays readable on a machine without those fonts. It is not part of the automated suite because it
needs the browser.
