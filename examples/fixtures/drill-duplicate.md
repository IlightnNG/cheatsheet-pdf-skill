# Drill Duplicates The Exam

> **Layout standard**
> WRONG ON PURPOSE: the drill recomputes the same capacity formula the chapter's past paper just
> computed, so the second copy teaches nothing and doubles the space.
> **Meta:** test fixture

# 1 · Capacity

## ★★★ 1.1 Formulas

$$!C=1-h_2(\epsilon)$$

*Meaning:* ==capacity== of the BSC.

$$?h_2(\epsilon)=-\epsilon\log\epsilon-(1-\epsilon)\log(1-\epsilon)$$

## ★★★ 1.2 Statements to judge (one line each)

- Capacity is a property of the ==channel==.
- A uniform input is optimal for the BSC.
- $C$ is decreasing in $\epsilon$.

## ★★★ 1.3 2023 Q4 — BSC capacity (10 marks)

*Q.* BSC with $\epsilon=0.25$.

- (a) $C=1-h_2(0.25)=0.189$ bit/use.
- (b) At $R=0.1$ reliable transmission is possible.

> **Key** — capacity is the supremum of reliable rates.

## ★★★ 1.4 Worked example — the same capacity again

*Data.* A BSC with $\epsilon=0.1$.

- $C = 1-h_2(0.1) = 1-0.469 = 0.531$
- $R = 0.4$ is below capacity, so a code exists
