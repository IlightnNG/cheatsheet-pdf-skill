# Good Sheet

> **Layout standard**
> Minimal but valid: two chapters, each with formulas, its statements section, a worked example
> and a plain-text drill.
> **Meta:** test fixture

# 1 · Warm-up

## ★★★ 1.1 Formulas

$$!H(X)=-\sum_xp(x)\log p(x)$$

*Meaning:* ==entropy== is the average surprisal.

$$?H(X\vert Y)=H(XY)-H(Y)$$

## ★★★ 1.2 Statements to judge (one line each)

- ==Entropy== is concave in the input distribution.
- $H(X\vert Y)\le H(X)$ always.
- $H(X)=0$ iff the distribution is deterministic.
- $H(X)\le\log|\mathcal X|$.
- Conditioning cannot create information.

## ★★★ 1.3 2024 Q1 — a small computation (6 marks)

*Q.* $X$ uniform on four symbols.

- (a) $H(X)=\log_24=2$ bits.
- (b) Two independent copies: $H=4$ bits.

> **Key** — independence adds entropies.

## ★★★ 1.4 Worked example — entropy of a four-point distribution

*Data.* $p=(1/2,1/4,1/8,1/8)$.

- $H(X) = -\sum p\log p = 1/2\cdot1 + 1/4\cdot2 + 2\cdot(1/8\cdot3) = 1.75$
- $2^{H(X)} = 2^{1.75} = 3.36$ effective symbols
- Check: uniform on 4 gives $H=2$, and $1.75<2$ as it must be

# 2 · Second topic

## ★★★ 2.1 Formulas

$$!C=\max_{P_X}I(X:Y)$$

*Meaning:* ==capacity== is the largest reliable rate.

$$?I(X:Y)=H(Y)-H(Y\vert X)$$

## ★★★ 2.2 Statements to judge (one line each)

- Capacity is a property of the ==channel==.
- A uniform input is optimal only for symmetric channels.
- $I(X:Y)\le\min(H(X),H(Y))$.
- Capacity is additive over independent uses.
- Feedback does not increase the capacity of a DMC.

## ★★★ 2.3 2023 Q4 — channel by hand (8 marks)

*Q.* BSC with $\epsilon=\tfrac14$.

- (a) $C=1-h_2(\tfrac14)=0.189$ bits.
- (b) At $R=0.1$ reliable transmission is possible.

> **Key** — capacity is the supremum of reliable rates.

## ★★★ 2.4 Worked example — three BSC numbers on one channel

*Data.* A BSC with $\epsilon=0.1$, used $n=1000$ times.

- $h_2(\epsilon) = -(0.1\log 0.1 + 0.9\log 0.9) = 0.469$
- $C = 1 - h_2(\epsilon) = 1 - 0.469 = 0.531$ bit/use
- $nC = 1000 \cdot 0.531 = 531$ bit
