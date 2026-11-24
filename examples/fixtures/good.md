# Good Sheet

> **Layout standard**
> Minimal but valid: two chapters, each with formulas, its statements section and a worked example.
> **Meta:** test fixture

# 1 · Warm-up

## ★★★ 1.1 Formulas

$$!H(X)=-\sum_xp(x)\log p(x)$$

$$?H(X\vert Y)=H(XY)-H(Y)$$

## ★★★ 1.2 Statements to judge (one line each)

- Entropy is <mark>concave</mark> in the input distribution.
- $H(X\vert Y)\le H(X)$ always.

## ★★★ 1.3 2024 Q1 — a small computation (6 marks)

*Q.* $X$ uniform on four symbols.

- (a) $H(X)=\log_24=2$ bits.
- (b) Two independent copies: $H=4$ bits.

> **Key** — independence adds entropies.

# 2 · Second topic

## ★★★ 2.1 Formulas

$$!C=\max_{P_X}I(X:Y)$$

$$?I(X:Y)=H(Y)-H(Y\vert X)$$

## ★★★ 2.2 Statements to judge (one line each)

- Capacity is a property of the <mark>channel</mark>.
- A uniform input is optimal only for symmetric channels.

## ★★★ 2.3 2023 Q4 — channel by hand (8 marks)

*Q.* BSC with $\epsilon=\tfrac14$.

- (a) $C=1-h_2(\tfrac14)=0.189$ bits.
- (b) At $R=0.1$ reliable transmission is possible.

> **Key** — capacity is the supremum of reliable rates.

## ★★★ 2.4 Worked example — the BSC capacity with numbers

*Scenario.* A BSC flips each bit with $\epsilon=0.1$; what rate can be trusted?

- (a) $h_2(0.1)=0.469$.
- (b) $C=1-0.469=0.531$ bits per channel use.
- (c) Check: at $\epsilon=\tfrac12$, $h_2=1$ and $C=0$ — the worst channel, as expected.
