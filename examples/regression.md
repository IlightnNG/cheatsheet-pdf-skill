# REGRESSION GUARDS

> **Layout standard**
> Every construct below once reached a printed sheet in a broken state. Rendering this file and
> running `lint.js` + `verify.js` must stay clean.
> **Meta:** one page · guards the parser and the linter

# 1 · Parser guards

## ★★★ 1.1 Emphasis must survive inline math

$$!I(\text{BSC}(\epsilon))=1-h_2(\epsilon)$$

- **BSC$(\epsilon)$** is bold although a formula sits inside the emphasis.
- A ==Kraft== inequality and a ==Hamming== bound carry a highlight, not literal equals signs.
- Inline `code chips` stay monospaced, and a table cell may hold **bold** and ==mark== too.

| what | renders as |
|---|---|
| **bold in a cell** | heavy weight |
| ==kw in a cell== | yellow highlight |

## ★★★ 1.2 Display blocks and priorities

$$?d=\min\{|S|:\{h_i\}_{i\in S}\ \text{is dependent}\}$$

- Three box types: `$$!` pink, `$$` blue, `$$?` grey — none may leak its marker.

## ★★ 1.3 Diagrams use math arrows, never box drawing

$$0\xrightarrow{\ 1-\epsilon\ }0\qquad 0\xrightarrow{\ \epsilon\ }1$$

# 2 · Linter guards

## ★★★ 2.1 What the linter rejects

- A box-drawing stroke (U+2500) outside math: the embedded fonts have no glyph for it.
- An escaped pipe inside a table row: use `\mid`.
- A section number that jumps: `--renumber` fixes it.
- The same past-paper question answered in two sections without part markers.
- A display formula carrying a sentence of prose in `\text{...}`.

## ★ 2.2 What the verifier adds

- Every `$$!`/`$$?` must be consumed by KaTeX before printing.
- On a multi-page sheet: no page over its column budget.
- One-page sheet: the columns must not widen the container.
- Hairlines thinned to 0.25 pt, A4 page, fonts embedded.
