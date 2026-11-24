# Drill On A Table

> **Layout standard**
> WRONG ON PURPOSE: the drill is laid out as a table. A table cannot split across a column and is
> the most common layout defect in a drill.
> **Meta:** test fixture

# 1 · One topic

## ★★★ 1.1 Formulas

$$!H(X)=-\sum_xp(x)\log p(x)$$

*Meaning:* ==entropy== is the average surprisal.

$$?I(X:Y)=H(X)-H(X\vert Y)$$

## ★★★ 1.2 Statements to judge (one line each)

- ==Entropy== is concave.
- Conditioning never increases it.

## ★★★ 1.3 Worked example — two entropies on one table

*Data.* $p=(1/2,1/4,1/4)$.

| formula | with the numbers | value |
|---|---|---|
| $H(X)$ | $-(1/2\cdot1+2\cdot1/4\cdot2)$ | 1.500 |
| $2^{H(X)}$ | $2^{1.5}$ | 2.828 |
