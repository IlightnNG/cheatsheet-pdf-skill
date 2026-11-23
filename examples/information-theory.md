# EE5139 FINAL CHEAT SHEET · Ch.1–8

> Meta: $\log=\log_2$ · bit · $0\log0=0$ · $h_2(p)=-p\log p-(1-p)\log(1-p)$ · $\delta_{\rm tvd}=\tfrac12\|P-Q\|_1$ · $\Phi(-1)=0.159$

# 1 · Information measures (Ch.1)

## ★★★ 1.1 Entropy

$$!H(X)=-\sum_xp(x)\log p(x)=\mathbb E\Big[\log\frac1{p(X)}\Big]$$

$$!H(X)\ge0\ (\text{=}0\iff\text{deterministic})$$

$$!H(X)\le\log|\mathcal X|$$

$$!(\text{=}\iff\text{uniform})$$

$$!h_2(p)\ \text{is concave, max }\tfrac12\ \text{at}\ p=\tfrac12$$


$$!H(\mathrm{Unif}\{1..n\})=\log n$$

$$!H(\mathrm{Bern}(p))=h_2(p)$$

$$!H(\mathrm{Geom}(p))=h_2(p)/p$$

*Meaning:* entropy is the average surprisal; it depends on the pmf, not on the alphabet labels.

## ★★★ 1.2 Joint, conditional, chain rules

$$H(XY)=H(X)+H(Y\vert X)=H(Y)+H(X\vert Y)$$

$$H(Y\vert X)=\sum_xp(x)H(Y\vert X=x)$$


$$!H(X_1\cdots X_n)=\sum_{i=1}^nH(X_i\vert X_1\cdots X_{i-1})$$

$$!H(XY\vert Z)=H(X\vert Z)+H(Y\vert XZ)$$

$$!H(X\vert Y)\le H(X)$$

$$!H(X\vert Y)=H(X)\iff X\perp Y$$

$$!H(XY)\le H(X)+H(Y)\ \text{(subadditive)}$$

$$!H(XYZ)+H(Y)\le H(XY)+H(YZ)\ \text{(strong subadditivity)}$$

*Meaning:* "conditional entropy = weighted average of the conditional entropies" is the only formula behind every averaging argument.

## ★★★ 1.3 Mutual information

$$!I(X:Y)=H(X)-H(X\vert Y)=H(X)+H(Y)-H(XY)=D(P_{XY}\Vert P_XP_Y)\ge0$$

$$I(X:Y)=I(Y:X)$$

$$I(X:X)=H(X)$$

$$I(X:Y)=0\iff X\perp Y$$

$$I(X:Y)\le\min\{H(X),H(Y)\}$$


$$I(X_1X_2:Y)=I(X_1:Y)+I(X_2:Y\vert X_1)$$

$$I(X:Y_1Y_2)=I(X:Y_1)+I(X:Y_2\vert Y_1)$$


$$!I(X:Y\vert Z)=H(X\vert Z)-H(X\vert YZ)$$


*Meaning:* the chain rule splits one variable at a time and dumps it into the conditioning — that is why "compute $I$ of a pair" always reduces to $I$ of singles plus a conditional term.

## ★★★ 1.4 Relative entropy and its consequences

$$!D(P\Vert Q)=\sum_xP(x)\log\frac{P(x)}{Q(x)}\ge0$$

$$!D(P\Vert Q)=0\iff P=Q$$

$$?D\ \text{is convex in}\ (P,Q)$$

$$!D(P_{XY}\Vert P_XP_Y)=I(X:Y)$$

$$D(P_{X\vert Y= y}\Vert Q_{X\vert Y= y})=\sum_xP(x\vert y)\log\frac{P(x\vert y)}{Q(x\vert y)}$$

$$D(P_{X\vert Y}\Vert Q_{X\vert Y}\vert P_Y)=\sum_yP(y)D(P_{X\vert Y=y}\Vert Q_{X\vert Y=y})$$

$$D(P_{XY}\Vert Q_{XY})=D(P_X\Vert Q_X)+D(P_{Y\vert X}\Vert Q_{Y\vert X}\vert P_X)$$

$$!\text{Pinsker:}\ \delta_{\rm tvd}(P,Q)\le\sqrt{\tfrac12D(P\Vert Q)}$$

$$?\text{Pythagorean (suff.\ statistics):}\ D(P_{X\vert Y}\Vert Q_{X\vert Y}\vert P_Y)\le D(P_X\Vert Q_X)$$

*Pf. (non-negativity):* $\log u\le u-1$ with $u=Q/P$ gives $\sum P\log(Q/P)\le\sum P(Q/P-1)=0$.

## ★★★ 1.5 Inequalities and Fano

- Jensen: $f$ <mark>concave</mark> ⇒ $f(\mathbb E X)\ge\mathbb E[f(X)]$; $f$ convex ⇒ the reverse inequality.

$$!(g\circ f)''=g''(f)(f')^2+g'(f)f''$$

- so if $g$ is <mark>convex</mark> and non-decreasing and $f$ is convex, then $g\circ f$ is convex.

$$!\Pr[X\ge a]\le\frac{\mathbb E[X]}{a}\ (X\ge0)$$

$$!\Pr[\vert X-\mathbb E X\vert\ge a]\le\frac{\mathrm{Var}X}{a^2}$$

$$?\mathrm{Var}(XY)=\mathrm{Var}X\,\mathrm{Var}Y+\mathrm{Var}X(\mathbb E Y)^2+\mathrm{Var}Y(\mathbb E X)^2$$

- Fano: $H(X\vert Y)\le h_2(\eta)+\eta\log\vert\mathcal X\vert$ with $\eta=\Pr[X\ne Y]$ — error probability becomes an information deficit; the most used step in every <mark>converse</mark>.

## ★★★ 1.6 Typicality (AEP)

$$!A^{(n)}_\mu=\Big\{x^n:\Big|-\tfrac1n\log P(x^n)-H(X)\Big|\le\mu\Big\}$$

$$P\big(A^{(n)}_\mu\big)\to1$$

$$\big|A^{(n)}_\mu\big|\le2^{n(H+\mu)}$$

$$!(1-\epsilon)2^{n(H-\mu)}\le\big|A^{(n)}_\mu\big|\ \text{(large }n)$$

$$!x^n\in A^{(n)}_\mu\Rightarrow 2^{-n(H+\mu)}\le P(x^n)\le2^{-n(H-\mu)}$$

$$!-\tfrac1n\log P(x^n)\to H\ \text{a.s.}$$

$$?\text{strong typicality:}\ \Big|\tfrac1nN(a\vert x^n)-P(a)\Big|\le\delta\ \forall a$$

$$?T^n_\delta\subseteq A^{(n)}_\mu\ \text{for small }\delta$$

*Meaning:* about $2^{nH}$ sequences carry almost all the mass, each of probability $\approx2^{-nH}$ — that is the whole source-coding theorem in one sentence.

*Trap.* The most probable sequence is not typical: its rate is $H_{\min}$, not $H$.

## ★★★ 1.7 Statements to judge (one line each)

- $H(X)\ge0$, with $=0$ iff $X$ is deterministic; $H(X)\le\log|\mathcal X|$, with $=$ iff uniform.
- $H(X\vert Y)\le H(X)$, with $=$ iff $X\perp Y$ — conditioning never increases uncertainty, because the difference is $I(X:Y)\ge0$.
- $I(X:Y)\ge0$ with $=$ iff $X\perp Y$; $I(X:X)=H(X)$; $I(X:Y)\le\min\{H(X),H(Y)\}$.
- $H(XY)\le H(X)+H(Y)$ (subadditive); $H(XYZ)+H(Y)\le H(XY)+H(YZ)$ (strong <mark>subadditivity</mark>).
- <mark>DPI</mark>: $X-Y-Z\Rightarrow I(X:Z)\le I(X:Y)$.
- Conditioning can create information: with $X,Y$ i.i.d. fair and $Z=X\oplus Y$, $I(X:Z)=0$ but $I(X:Z\vert Y)=1$. So $I(X:Y\vert Z)>I(X:Y)$ is possible.

# 2 · Source coding (Ch.2)

## ★★★ 2.1 Codes and Kraft

$$!R=\frac{\log M}{n}$$

$$?\text{nonsingular}\Rightarrow\text{UD}\Rightarrow\text{prefix}\ (\text{strictly stronger each step})$$

$$?\text{Kraft:}\ \sum_x2^{-\ell(x)}\le1$$


*Pf. (Kraft necessity):* the sets of strings extending each codeword are disjoint, of relative size $2^{-\ell_i}$ ⇒ sum $\le1$.

*Pf. (sufficiency):* sort lengths, place codeword $x$ at the first $\ell(x)$ bits of the binary expansion of $\sum_{x'<x}2^{-\ell(x')}$; disjointness follows from Kraft.

## ★★★ 2.2 Expected length: bounds and algorithms

$$?H(X)\le L<H+1$$

$$?L=\sum_xp(x)\ell(x)$$

$$?L^*=\min L\ \text{(optimal)}$$


$$!L^*\ge H(X)\ \text{(converse)}$$

$$?L^*<H+1\ \text{(Shannon)}$$

$$?\text{Huffman achieves }L^*$$

$$!\text{Shannon code:}\ \ell(x)=\lceil-\log p(x)\rceil$$


*Pf.* ($L\ge H$): $L-\log M=\sum_ip_i\log\frac1{Mp_i}\ge0$ by $\log u\le u-1$; equality iff all used codewords have $p_i=1/M$.

*Pf.* ($L<H+1$): Shannon's $\ell=\lceil-\log p\rceil<-\log p+1$ ⇒ $L<\sum p(-\log p)+1$.

*Trap.* Huffman minimises $\sum p_i\ell_i$ over prefix codes; it is not "the" entropy code — with mismatch the expected length is $\sum q_i\ell_i$, which can exceed $H(P)$.

## ★★ 2.3 Shannon code, Huffman, and comparisons

$$?\text{Shannon:}\ C(x)=\text{first }\ell(x)\ \text{bits of}\ \sum_{x'<x}p(x')$$

$$!\ell=\lceil\log\tfrac1{p(x)}\rceil\le\log\tfrac1{p(x)}+1$$

- Huffman tree: the two least likely symbols are siblings at maximum depth, and an optimal code never has unused leaves.

Shannon vs Huffman: lengths $\lceil-\log p\rceil$ vs tree lengths; Shannon guarantees $L<H+1$, Huffman is minimal; 2022 Q2 numbers $L_{\rm S}=\tfrac83$ vs $L_{\rm H}=\tfrac{20}{9}$.

## ★★★ 2.4 Source coding theorem

$$!R^*(X)=H(X)\qquad R>H(X)\Rightarrow P_e\to1$$

*Pf. (achievability, block):* encode only $T^n_\epsilon$; there are $\le2^{n(H+\epsilon)}$ typical sequences ⇒ $\log M\le n(H+\epsilon)$ with $P_e\le\epsilon$. Rate $H+2\epsilon$, let $\epsilon\to0$.

*Pf. (converse):* $nR\ge H(\hat X^n)\ge H(X^n)-H(X^n\vert\hat X^n)\ge nH(X)-1-n\epsilon\log|\mathcal X|$ by Fano; divide by $n$.

$$!\text{block: }\bar\ell_n/n\to H(X)$$

$$?\text{zero-error rate with fixed }n:\ \log|\{x:p(x)>0\}|\ \text{bits}$$

## ★★ 2.5 Sources with memory

$$!H(X^n)=\sum_{i=1}^nH(X_i\vert X_1\cdots X_{i-1})$$

$$?X_1-\cdots-X_n\ \text{Markov}\Rightarrow H(X^n)=H(X_1)+\sum_{i\ge2}H(X_i\vert X_{i-1})$$

$$!\text{stationary: }H(X_i)=H(X_1)\ \forall i$$

$$?\text{ergodic source: }-\tfrac1n\log P(x^n)\to H_{\rm rate}\ \text{a.s.}$$

*Meaning:* a Markov source is just a chain rule plus a repeated transition matrix; the per-symbol rate tends to the conditional entropy.

## ★★★ 2.6 Statements to judge (one line each)

- A prefix code is uniquely decodable; the <mark>converse</mark> fails (UD codes exist that are not prefix), but optimal expected length is always attained by a prefix code, so we may restrict to prefix codes.
- <mark>Kraft</mark>: $\sum_x2^{-\ell(x)}\le1$ is necessary for unique decodability and sufficient for a prefix code. Test: $\{1,3,3,3,3\}$ gives $\tfrac12+4\cdot\tfrac18=1$ ⇒ feasible.
- $H\le L^*<H+1$, where $L^*$ is the minimal expected length; $L^*=H$ iff every $p(x)$ is a negative power of 2 on the support.
- Huffman is optimal among all prefix codes; Shannon ($\ell=\lceil-\log p\rceil$) only guarantees $L<H+1$, so Huffman is never worse. In 2022 Q2 the numbers are $\tfrac{20}{9}$ (Huffman) vs $\tfrac83$ (Shannon).
- A larger alphabet can beat binary: the same source in 2022 Q2 has ternary average $\tfrac43<\tfrac{20}{9}$.
- Source coding theorem: $R^*(X)=H(X)$; for $R>H(X)$ the error tends to 1 (<mark>strong converse</mark>), for $R<H(X)$ it can be made to vanish with block coding, $\bar\ell_n/n\to H$.

## ★★★ 2.7 2022 Q2 — Huffman, Shannon, ternary (14 marks)

*Q.* $X\in\{1,\dots,5\}$ with $p=(\tfrac13,\tfrac13,\tfrac19,\tfrac19,\tfrac19)$.

- (a) Entropy. $H(X)=2\cdot\tfrac13\log_23+3\cdot\tfrac19\log_29=\tfrac23\log_23+\tfrac23\log_23=\tfrac43\log_23\approx2.113$.

- (b) Huffman. Merge $\tfrac19+\tfrac19=\tfrac29$; then $\tfrac19+\tfrac29=\tfrac13$; then $\tfrac13+\tfrac13=\tfrac23$; then $\tfrac13+\tfrac23=1$. Reading off: $C(1)=0$, $C(2)=10$, $C(3)=110$, $C(4)=1110$, $C(5)=1111$, lengths $(1,2,3,4,4)$.

- (c) Shannon. $\ell=\lceil-\log p\rceil=(2,2,4,4,4)$; with $F(1)=0$, $F(2)=\tfrac13$, $F(3)=\tfrac23$, $F(4)=\tfrac79$, $F(5)=\tfrac89$ the codewords are $00,01,1010,1100,1110$.

- (d) Expected lengths. $L_{\rm H}=1\cdot\tfrac13+2\cdot\tfrac13+3\cdot\tfrac19+4\cdot\tfrac19+4\cdot\tfrac19=\tfrac{20}{9}\approx2.222$; $L_{\rm S}=2\cdot\tfrac23+4\cdot\tfrac39=\tfrac83\approx2.667$. Check $H\le\tfrac{20}{9}<\tfrac83<H+1=3.113$.

- (e) Ternary. $C=(0,1,20,21,22)$ has lengths $(1,1,2,2,2)$; $L=\tfrac13+\tfrac13+2(\tfrac19+\tfrac19+\tfrac19)=\tfrac43\approx1.333$ — better than any binary code for this source.

## ★★★ 2.8 2023 Q2 (a)(b) — source part (part of 12 marks)

*Q.* Joint table with $P_Y=(\tfrac12,\tfrac12)$ and rows $y=1:(\tfrac1{16},\tfrac14,\tfrac18,\tfrac12,\tfrac1{16})$, $y=2:(\tfrac14,0,\tfrac14,\tfrac12,0)$.

(a) $H(Y)=1$; summing $-P\log P$ over the 9 non-zero cells gives $H(XY)=\tfrac{43}{16}$, hence
$$H(X\vert Y)=\tfrac{43}{16}-1=\tfrac{27}{16}\approx1.6875.$$
(b) Marginal $P_X=(\tfrac{5}{16},\tfrac14,\tfrac38,\tfrac12,0)$; the zero entry means that symbol is irrelevant (it can be dropped), and $H(X)=H(XY)-H(Y\vert X)$ is computed from the same table.

(c) Code with side information: the table lists $P_{X\vert Y}$, and <mark>the encoder knows $y$</mark>, so build one Shannon code per row. Row $y=1$: $p=(\tfrac1{16},\tfrac14,\tfrac18,\tfrac12,\tfrac1{16})$ are all dyadic ⇒ $\ell=(4,2,3,1,4)$ and sorted cumulants give $1110,\ 10,\ 110,\ 0,\ 1111$. Row $y=2$: $p=(\tfrac14,0,\tfrac14,\tfrac12,0)$ ⇒ $\ell=(2,-,2,1,-)$ and codes $10,\ -,\ 11,\ 0,\ -$.

(d) Decoder: the same string means different symbols in different rows — with $y=1$ the word $10$ is $x=2$, with $y=2$ it is $x=1$. Always decode <mark>inside the given row</mark>.

(e) Expected length: $1\cdot\tfrac12+2\cdot\tfrac38+3\cdot\tfrac1{16}+4\cdot\tfrac1{16}=\tfrac{27}{16}=H(X\vert Y)$ — every conditional probability is dyadic, so Shannon coding attains the conditional entropy exactly.

(f) Extractor from the same table: $P(x=4\vert y)=\tfrac12$ in <mark>both</mark> rows, so $f=\mathbf 1\{x=4\}$ gives a uniform bit independent of $Y$ (either polarity works).

## ★★★ 2.9 2024 Q3 — source with memory (14 marks)

*Q.* Four-state Markov chain with transition matrix (rows $=\Pr[X_{i+1}\vert X_i]$)
$$P=\tfrac14\begin{pmatrix}2&1&0&1\\1&2&1&0\\0&1&2&1\\1&0&1&2\end{pmatrix},\qquad X_1\ \text{uniform}.$$

(a) Uniform is stationary: $\tfrac14P=\tfrac14$, so $H(X_2)=-\tfrac14\log\tfrac14\times4=2$.

(b) Each row has entropy $-\tfrac12\log\tfrac12-2\cdot\tfrac14\log\tfrac14=\tfrac32$, so by the chain rule and the Markov property
$$H(X^n)=H(X_1)+(n-1)H(X_2\vert X_1)=2+(n-1)\tfrac32=\tfrac32n+\tfrac12.$$

(c) $\sum_{i=1}^nH(X_i)=2n$, and $2n\ge\tfrac32n+\tfrac12$ for $n\ge1$ — an instance of subadditivity; equality only at $n=1$.

(d) The stationary law is uniform on 4 symbols, so Huffman gives $\ell=(2,2,2,2)$, e.g. $00,01,10,11$, and $L=2$ bit/symbol; the extension has $L_n=\bar\ell$ from (b).

(e) Conditional Huffman (both sides know $x_{i-1}$; the next symbol is $\tfrac12$ at $x_{i-1}$ and $\tfrac14$ at $x_{i-1}\pm1$): $C(x_{i-1})=0$, $C(x_{i-1}{+}1)=10$, $C(x_{i-1}{-}1)=11$, lengths $(1,2,2)$, mean $\bar\ell_i=\tfrac12+\tfrac14\cdot2+\tfrac14\cdot2=\tfrac32$.

(f) Encode $X=(0,0,1,0,1,1,1,2)$: $(00,\,0,\,10,\,11,\,10,\,0,\,0,\,10)$ — the first symbol uses the marginal code (2 bits), the rest use the conditional code.

(g) Total expected length $L=2+(n-1)\tfrac32=\tfrac32n+\tfrac12=H(X^n)$: the sequential code is <mark>optimal</mark>, because each conditional law is dyadic so Huffman matches $H(X_i\vert X_{i-1})$ exactly.

# 3 · Hypothesis testing (Ch.3)

## ★★★ 3.1 Setup

$$?H_0:P_0\ \text{vs}\ H_1:P_1$$

$$?\text{test: accept }H_0\ \text{on}\ \mathcal A,\ \text{reject on}\ \mathcal A^c$$

$$!\alpha=P_0(\mathcal A^c)\ \text{(type I)}$$

$$!\beta=P_1(\mathcal A)\ \text{(type II)}$$

$$!\varepsilon_{\rm sym}=\tfrac12(\alpha+\beta)\ \text{(uniform prior)}$$

## ★★★ 3.2 Neyman–Pearson

$$!\beta_\alpha^*(P_0\Vert P_1)=\min\{\beta:\ \alpha\le\alpha\}$$

$$?\text{achieved by the likelihood-ratio test}\ \frac{P_0(x)}{P_1(x)}\ge\lambda$$

$$?\beta_\alpha^*\le\frac{1-\alpha}{2^{D(P_0\Vert P_1)}}\ \text{(one-shot)}$$

$$?-\frac1n\log\beta_{1-\epsilon}^*(P_0^{\times n}\Vert P_1^{\times n})\to D(P_0\Vert P_1)\ \text{(Stein)}$$

*Meaning:* the type-II error decays like $e^{-nD}$; the exponent is the relative entropy, not the total variation.

## ★★★ 3.3 Symmetric error and total variation

$$!\varepsilon_{\rm sym}(P_0,P_1)=\tfrac12\big(1-\delta_{\rm tvd}\big)$$

$$!=\tfrac12\min_{\mathcal A}\big[1-P_0(\mathcal A)+P_1(\mathcal A)\big]$$

$$=\tfrac12\min_{\mathcal A}\big[2-P_0(\mathcal A)-P_1(\mathcal A^c)\big]$$

$$?\delta_{\rm tvd}=\tfrac12\sum_x\vert P_0(x)-P_1(x)\vert=\max_{\mathcal A}\big[P_0(\mathcal A)-P_1(\mathcal A)\big]$$

$$!\delta_{\rm tvd}\le\sqrt{\tfrac12D(P_0\Vert P_1)}\ \text{(Pinsker)}$$

*Trap.* The definition needs the complement on one term; without it the expression collapses to the constant $1$.

## ★★ 3.4 Chernoff bound and one-shot bounds

$$!C(P_0,P_1)=\min_{0\le s\le1}\log\sum_xP_0(x)^{1-s}P_1(x)^{s}$$

$$?\beta^*_\alpha\ \text{is}\ \text{(approximately)}\ 2^{-nC}\ \text{at}\ \alpha=\tfrac12$$

$$!\alpha+\beta\ge\tfrac12e^{-D(P_0\Vert P_1)}\ \text{(BH)}$$

$$!\varepsilon_{\rm sym}\ge\tfrac12\big(1-\sqrt{\tfrac12D}\big)$$

*Meaning:* symmetric error is governed by $\delta_{\rm tvd}$ (one-shot) and Chernoff (exponent); asymmetric by $D$ (Stein).

## ★★★ 3.5 Statements to judge (one line each)

- With uniform prior and a test that accepts $H_0$ on $\mathcal A$, the average error is $\tfrac12[P_0(\mathcal A^c)+P_1(\mathcal A)]$, and minimising over $\mathcal A$ gives $\tfrac12(1-\delta_{\rm tvd})$.
- The Neyman–Pearson test (likelihood ratio threshold) minimises $\beta$ at fixed $\alpha$; $\beta^*_\alpha$ denotes that minimum.
- Stein: at fixed $\alpha$, $-\tfrac1n\log\beta^*\to D(P_0\Vert P_1)$. Chernoff: for $\alpha=\beta$ the exponent is $\min_s\log\sum P_0^{1-s}P_1^{s}$.
- Pinsker: $\delta_{\rm tvd}\le\sqrt{\tfrac12D}$ — total variation is controlled by relative entropy, not <mark>converse</mark>ly.
- The complement matters: $\tfrac12\min_{\mathcal A}[2-P_0(\mathcal A)-P_1(\mathcal A)]\equiv1$ is not an error probability.

# 4 · Randomness extraction (Ch.4)

## ★★★ 4.1 Objects

$$!\delta_{\rm tvd}(P,Q)=\tfrac12\sum_z\vert P(z)-Q(z)\vert$$

- $P_{ZY}\ \text{is}\ \epsilon\text{-close to}\ U_Z\times P_Y\iff\delta_{\rm tvd}\big(P_{ZY},U_Z\times P_Y\big)\le\epsilon$

$$!p_{\rm guess}(X\vert Y)=\sum_yP_Y(y)\max_xP_{X\vert Y}(x\vert y)$$

$$!H_{\min}(X\vert Y)=-\log p_{\rm guess}$$

$$!H_{\min}(X\vert Y)\le H(X\vert Y)$$

$$?H^\epsilon_{\min}(X\vert Y)=\max_{\tilde P_{XY}:\,\delta_{\rm tvd}(\tilde P,P)\le\epsilon}H_{\min}(\tilde P_{XY}\vert Y)$$

$$!0\le H^\epsilon_{\min}\le H_{\min}+\log\tfrac1{1-\epsilon}$$

- <mark>Extractor</mark>: $f:\{0,1\}^n\times\{0,1\}^r\to\{0,1\}^L$ with $\big\|P_{f(X,S)S}-U_L\times U_S\big\|_{\rm tvd}\le\epsilon$.

*Meaning:* $p_{\rm guess}$ is the best success probability of guessing $X$ from $Y$; min-entropy is its negative log, and it is the "worst-case" entropy relevant to extraction.

## ★★ 4.2 Two-universal hashing

$$?\{f_s\}_{s\in S}\ \text{two-universal}:$$

$$!\Pr_S\big[f_S(x)=f_S(x')\big]\le2^{-L}$$

$$\forall x\ne x'$$

- Construction: $f_s(x)=$ first $L$ bits of $s\cdot x$ over $\mathrm{GF}(2^m)$, $s\ne0$ uniform; the seed is $m$ bits.
- All functions $\mathcal X\to\{0,1\}$ are <mark>two-universal</mark> ($\Pr=\frac12$) but need $2^{|\mathcal X|}$ seed bits.

*Meaning:* two-universal = "behaves like a random function on pairs"; the LHL only ever uses pairwise collisions, so this cheap family is enough.

## ★★ 4.3 Extraction, in formulas

$$!L=H_{\min}(X\vert Y)-2\log\frac1\delta\ \Rightarrow\ \epsilon\le\delta$$

$$?\{f_s(x)=s\cdot x\}\ \text{is two-universal over}\ \mathrm{GF}(2^m),\ \text{seed }m\ \text{bits}$$


## ★★★ 4.4 Statements to judge (one line each)

- An <mark>extractor</mark> must produce strings that are $\epsilon$-close to uniform and independent of the side information: $\delta_{\rm tvd}(P_{f(X,S)S},U_L\times U_S)\le\epsilon$.
- $H_{\min}(X\vert Y)=-\log p_{\rm guess}\le H(X\vert Y)$; the gap can be large, and it is $H_{\min}$ that bounds extraction, never $H$.
- Smoothing helps by at most $\log\frac1{1-\epsilon}$: $H^\epsilon_{\min}\le H_{\min}+\log\frac1{1-\epsilon}$, so at $\epsilon=\tfrac12$ it buys one bit.
- LHL: a random <mark>two-universal</mark> hash achieves error $\le\tfrac12\sqrt{2^{L-H_{\min}}}$ on average over the seed; the proof only uses pairwise collisions, which is why two-universality is exactly enough.
- Converse: every extractor obeys $L\le H^\epsilon_{\min}(X\vert Y)$ — no scheme can output more than the smooth <mark>min-entropy</mark>.
- Deterministic post-processing never increases <mark>min-entropy</mark>, and applying a function to $X$ cannot create secret bits.

## ★★★ 4.5 2023 Q2 (c)(d) — extraction (part of 12 marks)

*Q.* Same table: $P_Y=(\tfrac12,\tfrac12)$, rows $y=1:(\tfrac1{16},\tfrac14,\tfrac18,\tfrac12,\tfrac1{16})$, $y=2:(\tfrac14,0,\tfrac14,\tfrac12,0)$. Find $H_{\min}(X\vert Y)$ and an extractor giving one uniform bit.

(a) Per-column maxima are $\max(\tfrac1{16},\tfrac14)=\tfrac14$, $\max(\tfrac14,0)=\tfrac14$, $\max(\tfrac18,\tfrac14)=\tfrac14$, $\max(\tfrac12,\tfrac12)=\tfrac12$, $\max(\tfrac1{16},0)=\tfrac1{16}$. Hence
$$p_{\rm guess}=\tfrac12\cdot\tfrac12+\tfrac12\cdot\tfrac12=\tfrac12$$

$$\Rightarrow$$

$$H_{\min}(X\vert Y)=1.$$


(b) Take $A=\{4\}$: in row 1 the mass is $\tfrac12$, in row 2 it is also $\tfrac12$, so $P(A\vert y)=\tfrac12$ for both $y$. Set $f(4)=0$ and $f(x)=1$ for $x\ne4$; then $P(f(X)=0\vert y)=\tfrac12$ for every $y$, so $f(X)$ is exactly uniform and independent of $Y$: $\delta_{\rm tvd}=0$.

(c) Why not 2 bits. In each row the symbol 4 has mass $\tfrac12$, so any set has mass $0,\tfrac12$ or $1$ — no set of mass $\tfrac14$ exists, hence no 4-way split. This matches the bound $L\le H^\epsilon_{\min}=1$.

# 5 · Linear codes (Ch.5)

## ★★★ 5.1 Parameters and the two bounds

- $[n,k,d]_q:\ \vert C\vert=q^k,\ R=\tfrac kn,\ \text{corrects}\ \lfloor\tfrac{d-1}2\rfloor,\ \text{detects }d-1,\ \text{erases }d-1$

$$?d=\min_{c\ne0}w(c)$$

$$?d=\min\big\{|S|:\{h_i\}_{i\in S}\ \text{linearly dependent}\big\}$$


$$\vert C\vert\le\frac{q^n}{\sum_{i=0}^{t}\binom ni(q-1)^i},\ t=\lfloor\tfrac{d-1}2\rfloor$$


$$!d\le n-k+1$$


$$!\text{perfect}\iff\vert C\vert\sum_{i=0}^{t}\binom ni(q-1)^i=q^n,\quad t=\lfloor\tfrac{d-1}2\rfloor$$

$$!\text{MDS}\iff d=n-k+1$$

$$!\text{binary }d=3:\ \vert C\vert\le\frac{2^n}{n+1}$$

$$!\vert C\vert\le\frac{2d}{2d-n}\ (2d>n)\ \text{(Plotkin)}$$

$$!\text{shortening}\ [n-1,k-1,\ge d]$$

$$?\text{puncturing}\ [n-1,k,d-1]$$

## ★★★ 5.2 How to read $d$ off $H$, and how to test perfect

<mark>$d$ = the smallest set of columns of $H$ that sums to zero.</mark> Read it in two steps:

| What you see in $H$ | Weight it forbids | Consequence |
|---|---|---|
| a zero column | — | $d=1$ (that column is a weight-1 word) |
| no zero column | weight 1 | $d\ge2$ |
| no two columns proportional (char 2: same support) | weight 2 | $d\ge3$ |
| three columns summing to zero | — | $d\le3$ |

Lower bounds come from the table; the upper bound needs an explicit dependent set (equivalently a weight-$w$ word). Pin $d$ when they meet.

<mark>Perfect test:</mark> with $t=\lfloor\frac{d-1}2\rfloor$ and $V_q(t)=\sum_{i=0}^{t}\binom ni(q-1)^i$, the code is perfect iff $\vert C\vert\,V_q(t)=q^n$.

$$?[7,4,3]_2:\ V=1+7=8,\ 16\cdot8=128=2^7\ \Rightarrow\ \text{perfect}$$

$$?[5,2,3]_4:\ V=1+15=16,\ 16\cdot16=256\neq4^5\ \Rightarrow\ \text{not perfect}$$

$$?[8,4,4]_2:\ V=1+8=9,\ 16\cdot9=144\neq256\ \Rightarrow\ \text{not perfect}$$

## ★★★ 5.3 The matrices

$$?G\in\mathbb F_q^{n\times k}\ (\text{columns span }C)$$

$$H\in\mathbb F_q^{(n-k)\times n}$$

$$!HG=0$$

$$!c\in C\iff Hc^\top=0$$

$$!G=\binom{I_k}{A}\iff H=(-A\mid I_{n-k})$$

$$!(\mathrm{char}\,2:-A=A)$$


$$!k=n-{\rm rank}(H)$$

$$!R=1-\frac{{\rm rank}(H)}{n}$$

$$!C^\perp=\{y:\ y^\top c=0\ \forall c\in C\}$$

*Meaning:* the identity block appears iff the code is in systematic form (information coordinates first). Any code reaches it by row operations plus a coordinate permutation — so "no identity block" means "the equations were not written in that order", nothing more.

*Trap.* $k=n-{\rm rank}(H)$, not $n-\#\text{equations}$: a dependent equation must not be counted (2022 Q4 had 4 equations, rank 3).

## ★★★ 5.4 Dual and syndromes

$$!G_\perp=H^\top$$

$$!H_\perp=G^\top$$

$$!k_\perp=n-k$$

$$!R_\perp=1-R$$

$$?d_\perp\ \text{recomputed from }H^\top$$

$$?s=Hy^\top=He^\top$$

$$?\text{single error at }j\iff s=h_j$$

$$?s(e)=s(e')\iff e-e'\in C$$


- <mark>Coset leader</mark> = the minimum-weight representative of the coset; syndrome decoding is a table lookup; perfect codes have leaders of weight $\le1$.

## ★★★ 5.5 Named codes

$$?\text{Hamming }[2^m-1,\ 2^m-1-m,\ 3]\ \text{(perfect)}$$

$$!H\ \text{columns}=\text{all nonzero }m\text{-vectors}$$

$$!\text{Reed–Solomon }[n,k,n-k+1]_q\ \text{(MDS)},\ n\le q$$

$$?\text{extended Hamming }[2^m,2^m-1-m,4]$$

$$?\text{parity check }[n,n-1,2]:\ d=2\ \text{detects one error, corrects none}$$

$$?\text{repetition }[n,1,n]$$

## ★★ 5.6 Decoding in practice

$$?\text{ML decoding: }\hat c=\arg\max_{c\in C}P(y\vert c)$$

- Standard array: rows = cosets, first column = leaders, first row = codewords; $q^{n-k}$ rows by $q^k$ columns.

*Meaning:* decoding is a partition of the whole space into decision regions; distance determines how large the correct regions can be.

## ★★★ 5.7 Template: equations → $H$ → $G$

$$!x_1+x_2=0,\quad x_3+x_4=0,\quad x_1+x_3+x_5=0$$

1. Copy coefficients as rows: $H=\begin{smallmatrix}1&1&0&0&0\\0&0&1&1&0\\1&0&1&0&1\end{smallmatrix}$.
2. Rank by elimination: $r=3$.
3. $k=n-r=2$.
4. Solve $Hc=0$: $x_2=x_1$, $x_4=x_3$, $x_5=x_1+x_3$; free $x_1=a,x_3=b$ ⇒ $G=\begin{smallmatrix}1&0\\1&0\\0&1\\0&1\\1&1\end{smallmatrix}$.
5. Verify $HG=0$.
6. $d$ from columns: no zero, no repeats ⇒ $d\ge3$; $h_1+h_2=h_5$ ⇒ $d=3$.

*Systematic form:* order $(x_1,x_3,x_2,x_4,x_5)$ ⇒ $H=(A\mid I_3)$, $G=\binom{I_2}{A}$ with $A=\begin{smallmatrix}1&0\\0&1\\1&1\end{smallmatrix}$.

## ★★ 5.8 $q$-ary Hamming, Reed–Solomon, and a syndrome run

- $q$-ary Hamming: $\big[(q^m-1)/(q-1),\ (q^m-1)/(q-1)-m,\ 3\big]_q$, <mark>perfect</mark>; $H$ = all nonzero projective points.

$$?\text{RS:}\ [q,k,q-k+1]_q,\ c_j=p_m(\alpha_j)\ \text{for distinct }\alpha_j;\ \text{MDS, needs }n\le q$$

$$!\text{simplex }=\text{Hamming}^\perp:\ [2^m-1,\ m,\ 2^{m-1}]$$

$$?\text{extended Hamming }[2^m,2^m-1-m,4]$$

*Example (syndrome run).* Hamming $(7,4,3)$, received $y=1010100$ (ones at 1,3,5): $s=c_1+c_3+c_5=(110)+(011)+(100)=(001)$ ⇒ the column $(001)$ is position 7 ⇒ flip it ⇒ $\hat c=1010101$.

*Meaning:* the syndrome identifies the position, and the coset-leader rule is what makes single errors always correctable.

## ★★★ 5.9 Statements to judge (one line each)

- $G$ is $n\times k$ with $k=\mathrm{rank}(G)$; $H$ is $(n-k)\times n$ and $HG=0$; $c$ is a codeword iff $Hc^\top=0$.
- $k=n-\mathrm{rank}(H)$ — subtract the rank, not the number of equations: dependent equations must not be counted (2022 Q4 has 4 equations of rank 3).
- $d=\min_{c\ne0}w(c)$ equals the size of the smallest linearly dependent set of columns of $H$. No zero column ⇒ $d\ge2$; no two proportional columns ⇒ $d\ge3$; and $q$-ary: no two columns in a ratio in $\mathbb F_q^*$ ⇒ $d\ge3$. To pin $d$ down, add an upper bound by exhibiting a weight-$w$ word (equivalently $w$ columns summing to zero) — the two bounds must meet.
- <mark>Hamming bound</mark> $\vert C\vert\le q^n/\sum_{i\le t}\binom ni(q-1)^i$; equality defines a perfect code. Singleton $d\le n-k+1$; equality defines an MDS code.

- How to test <mark>perfect</mark>: compute $t=\lfloor\tfrac{d-1}2\rfloor$, then $V_q(t)=\sum_{i=0}^{t}\binom ni(q-1)^i$; the code is perfect iff $\vert C\vert V_q(t)=q^n$. Known perfect codes: Hamming, repetition of odd length, binary Golay $[23,12,7]$, ternary Golay $[11,6,5]$. Perfect and MDS are independent notions ($[7,4,3]$ is perfect, not MDS; $[5,2,3]_4$ is neither).
- The identity block appears iff the code is written in <mark>systematic</mark> form: $G=\binom{I_k}{A}\iff H=(-A\vert I_{n-k})$, and over $\mathbb F_2$ the minus sign is invisible. It is not a property of Hamming codes.
- The <mark>dual</mark> has $G_\perp=H^\top$, $H_\perp=G^\top$, $k_\perp=n-k$, $R_\perp=1-R$; $d_\perp$ must be recomputed — the dual does not preserve distance ($[7,4,3]^\perp=[7,3,4]$).

## ★★★ 5.10 2022 Q4 — Hamming $(7,4,3)$ (8 marks)

*Q.* The code is defined by four parity equations on $x_1,\dots,x_7$; the third equation is the sum of the first two. The parity-check matrix is
$$H=\begin{pmatrix}1&0&0&1&1&1&0\\1&0&1&0&0&1&1\\1&1&0&1&0&0&1\end{pmatrix}.$$

(a) Rank. The three rows are independent (Gaussian elimination), so $\mathrm{rank}=3$ and $k=7-3=4$.

(b) Distance. Weight 1 is impossible (every column is non-zero); weight 2 would need two identical columns (none); weight 3 exists ($h_1+h_4+h_5=0$), so $d=3$. Hence $[7,4,3]$.

(c) Systematic form. Row operations give
$$H'=\begin{pmatrix}1&1&1&0&1&0&0\\0&1&1&1&0&1&0\\1&1&0&1&0&0&1\end{pmatrix}=(A\vert I_3),\qquad G=\begin{pmatrix}I_4\\ A'\end{pmatrix}$$
and the 16 codewords are $0000000$, $1000101$, $0100111$, $0010110$, $0001011$, $1100010$, $1010011$, $1001110$, $0110001$, $0101100$, $0011101$, $1110100$, $1101001$, $1011000$, $0111010$, $1111111$.

(d) Perfect. Here $q=2$, $n=7$, $t=\lfloor\tfrac{3-1}2\rfloor=1$, so $V_2(1)=\binom70+\binom71=1+7=8$ (the word itself plus its 7 single-error neighbours) and $|C|=16$. Then $|C|V_2(1)=16\cdot8=128=2^7=q^n$: the Hamming bound is tight, so the code is perfect and corrects exactly 1 error.

## ★★★ 5.11 2023 Q3 — code over $\mathbb F_4$, length 5 (10 marks)

*Recall:* $\mathbb F_4=\{0,1,\omega,\bar\omega\}$, $\bar\omega=\omega^2=\omega+1$, $\omega^3=1$, and characteristic 2 ($1+1=0$, so $-A=A$).

*Q.* A linear code over $\mathbb F_4$ with $G$ a $5\times3$ generator; $\omega$ generates $\mathbb F_4^*$, $\bar\omega=\omega^2$.

(a) Parameters. Row-reducing $G$ gives rank 2, so $k=2$, $\vert C\vert=4^2=16$; hence $[5,2]$.

(b) Parity check. With $G$ in systematic form, $H=(-A\vert I_3)$:
$$H=\begin{pmatrix}1&0&1&0&0\\1&\bar\omega&0&1&0\\0&\omega&0&0&1\end{pmatrix}.$$

(c) Distance. No zero column and no proportional pair ⇒ $d\ge3$; and $H(1,0,1,1,0)^\top=0$ gives a weight-3 codeword ⇒ $d=3$. Thus $[5,2,3]_4$.

(d) Bonus check (not an exam part). Hamming: $4^5/(1+5\cdot3)=64>16$ ⇒ not perfect; $d=3<5-2+1=4$ ⇒ not MDS.

## ★★★ 5.12 2024 Q4 — the dual of the Hamming code (8 marks)

*Q.* $G$ is $7\times4$:
$$G=\begin{pmatrix}1&0&0&0&0&1&1\\0&1&0&0&1&0&1\\0&0&1&0&1&1&0\\0&0&0&1&1&1&1\end{pmatrix}=(I_4\vert P).$$

(a) Parity check. $H=(-P^\top\vert I_3)$, which over $\mathbb F_2$ is
$$H=\begin{pmatrix}0&1&1&1&1&0&0\\1&0&1&1&0&1&0\\1&1&0&1&0&0&1\end{pmatrix},\qquad HG=0.$$

(b) Dual generator. $G_\perp=H^\top$ ($7\times3$); its rows are the three rows of $H$ transposed, so $k_\perp=3$ and $R_\perp=\tfrac37$.

(c) Dual distance. Each row of $H$ has weight 4, and so does every sum of two rows ($11011$, $10101$, $01110$), so $d_\perp=4$: the dual is $[7,3,4]$.

(d) Lesson. $d_\perp\ne d$ in general — do not copy the distance across a duality argument.

# 6 · Channel capacity (Ch.6)

## ★★★ 6.1 Definition

$$!I(W)=\max_{P_X}I(X:Y)$$

$$!I(w,P)=\max_{P_X:\ \mathbb E[X^2]\le P}I(X:Y)$$

$$!0\le I(W)\le\min\{\log\vert\mathcal X\vert,\log\vert\mathcal Y\vert\}$$

$$?I\ \text{is concave in}\ P_X\ \Rightarrow\ \text{stationary}=\text{global}$$

$$?I(W)=\min_{Q_Y}\max_xD\big(W(\cdot\vert x)\Vert Q_Y\big)\ \text{(geometric)}$$

*Meaning:* capacity is a property of the channel alone; $I(X:Y)$ also depends on $P_X$. Writing $C=I(X:Y)$ without naming the optimal input is a logic error.

## ★★★ 6.2 The four channels — described and sketched

BSC$(\epsilon)$ — binary in, binary out; each bit is flipped with probability $\epsilon$, independently. The receiver gets a bit but not the position of the flip.
$$0\xrightarrow{\ 1-\epsilon\ }0\qquad 0\xrightarrow{\ \epsilon\ }1$$

$$1\xrightarrow{\ \epsilon\ }0\qquad 1\xrightarrow{\ 1-\epsilon\ }1$$
$$!\mathrm{BSC}:\ C=1-h_2(\epsilon)$$
Row $(1-\epsilon,\epsilon)$; uniform input is optimal; $H(Y\vert X)=h_2(\epsilon)$ for every input.

BEC$(\epsilon)$ — binary in, ternary out $\{0,1,?\}$: the bit is either kept or replaced by an erasure mark, so the erasure tells you where the loss happened.
$$0\xrightarrow{\ 1-\epsilon\ }0\qquad 0\xrightarrow{\ \epsilon\ }?$$

$$1\xrightarrow{\ 1-\epsilon\ }1\qquad 1\xrightarrow{\ \epsilon\ }?$$
$$!\mathrm{BEC}:\ C=1-\epsilon$$
$I=(1-\epsilon)H(X)$ for every input; uniform input is optimal; the output is not uniform unless the input is.

Z channel$(\epsilon)$ — binary; only the transition $1\to0$ can go wrong (a "stuck at 0" input).
$$0\xrightarrow{\ 1\ }0\qquad 1\xrightarrow{\ 1-\epsilon\ }1$$

$$1\xrightarrow{\ \epsilon\ }0$$
$$!\mathrm{Z}:\ C=\log_2\Big(1+(1-\epsilon)\epsilon^{\frac{\epsilon}{1-\epsilon}}\Big)$$
Uniform input is not optimal: at $\epsilon=\tfrac12$ the optimum is $P(X=1)=\tfrac25$ and $C=\log_2\tfrac54=0.322$.

AWGN — continuous; the channel adds Gaussian noise, $Y=X+Z$ with $Z\sim\mathcal N(0,\sigma^2)$.
$$X\xrightarrow{\ +Z\ }Y,\quad Z\sim\mathcal N(0,\sigma^2),\quad p(y\vert x)=\mathcal N(y;x,\sigma^2)$$
$$!\mathrm{AWGN}:\ C=\tfrac12\log\Big(1+\frac{P}{\sigma^2}\Big)$$
Gaussian input is optimal; a binary input (BPSK) gives only $1-h_2(\Phi(-\sqrt P/\sigma))$, which is strictly smaller.

How to tell them apart. BSC loses the *location* of the error; BEC loses the *value* but keeps the location; Z loses only one direction; AWGN adds noise to a continuous value without a discrete error event.

$$!\text{cascade }\mathrm{BSC}(p)\to\mathrm{BSC}(q):\ p'=p+q-2pq$$

$$!\text{parallel}:\ I=I_1+I_2\qquad \text{switched}:\ 2^I=2^{I_1}+2^{I_2}$$

*Trap.* BEC $=1-\epsilon$, BSC $=1-h_2(\epsilon)$ — never swap; uniform input is optimal only for symmetric channels (Z and AWGN are not).

## ★★★ 6.3 Differential entropy

$$!h(X)=-\int p\log p\,dx$$

$$!h(\mathcal N(0,\sigma^2))=\tfrac12\log(2\pi e\sigma^2)$$

$$!h(\mathrm{Unif}[0,a])=\log a$$

$$h(X+a)=h(X)$$

$$h(cX)=h(X)+\log\vert c\vert$$

$$h(X)\le\tfrac12\log(2\pi e\,\mathrm{Var}X)$$


$$?h\ \text{can be negative; only differences }I(X:Y)=h(Y)-h(Y\vert X)\ \text{and}\ D\ \text{are meaningful}$$

## ★★★ 6.4 AWGN

$$!C=\tfrac12\log\Big(1+\frac{P}{\sigma^2}\Big)$$

$$?\text{doubling power }+\tfrac12\ \text{bit}$$

$$?\text{one more bit needs }4\times P$$

*Pf.* $h(Y\vert X)=h(Z)=\tfrac12\log(2\pi e\sigma^2)$; $\mathbb E[Y^2]\le P+\sigma^2$; Gaussian maximises entropy at fixed variance ⇒ $h(Y)\le\tfrac12\log(2\pi e(P+\sigma^2))$; subtract; $X\sim\mathcal N(0,P)$ is tight.

## ★★★ 6.5 BPSK $=$ BSC

$$!x_0=\sqrt P$$

$$!\hat m=\operatorname{sgn}(y)$$

$$!p_{\rm err}=\Phi\Big(-\frac{\sqrt P}{\sigma}\Big)$$

$$!I=1-h_2(p_{\rm err})\le\tfrac12\log\Big(1+\frac{P}{\sigma^2}\Big)$$

*Pf.* $Y<0\iff Z<-x_0$ when $+1$ sent ⇒ $p_{\rm err}=\Pr(Z<-x_0)=\Phi(-\sqrt P/\sigma)$; symmetric messages ⇒ $p_{\max}=p_{\rm avg}$; DPI $M\to X\to Y\to\hat M$.

## ★★ 6.6 Recipe for an asymmetric channel

1. Delete useless inputs.
2. Average over the symmetry group (concavity) to reduce $P_X$ to a low-dimensional family.
3. Write $I(P_X)$, use concavity: a stationary point is global.
4. No closed form ⇒ geometric form or Blahut–Arimoto.
5. Check against BSC/BEC/perfect sub-channel endpoints.

## ★★★ 6.7 Statements to judge (one line each)

- $I(W)=\max_{P_X}I(X:Y)$; <mark>capacity</mark> is a property of the channel, while $I(X:Y)$ also depends on the input. Writing $C=I(X:Y)$ without naming the optimal input is an error.
- $I$ is concave in $P_X$, so a <mark>stationary</mark> point is the global maximum — this is what justifies "guess the symmetric input and check".
- If the rows of $W$ are permutations of one another, the <mark>uniform input</mark> is optimal and $C=\log|\mathcal Y|-H(\text{row})$.
- A row that does not depend on $x$ is a <mark>useless symbol</mark>: give it probability zero (2023 Q4.1, 2022 Q3.1).
- BSC: $C=1-h_2(\epsilon)$; BEC: $C=1-\epsilon$; the BEC is better for every $\epsilon<0.773$.
- AWGN: $C=\tfrac12\log(1+P/\sigma^2)$ with a power constraint, $\infty$ without one.

## ★★★ 6.8 2022 Q3 — squeeze and symmetry (10 marks)

*Q.* (a) A 3-input 2-output channel whose inputs 0 and 1 are indistinguishable, while $\{0,1\}$ and $\{2\}$ are perfectly distinguishable. (b) A channel symmetric under $0\leftrightarrow2$ with rows $(1-\epsilon,\epsilon)$, $(\tfrac12,\tfrac12)$, $(\epsilon,1-\epsilon)$.

(a) $C=1$. Merging the indistinguishable inputs leaves at most two effective inputs, so $C\le\log2=1$; the pair $\{0,1\}$ vs $\{2\}$ gives a perfect binary sub-channel, so $C\ge1$. Hence $C=1$.

(b) Symmetry reduction. The channel is invariant under $0\leftrightarrow2$, so by concavity it suffices to test $P_X=(a,1-2a,a)$, $a\in[0,\tfrac12]$. The output is
$$q=\big(a(1-\epsilon)+(1-2a)\tfrac12+a\epsilon,\ \ldots\big)=\big(\tfrac12,\tfrac12\big)$$
for every $a$, so $H(Y)=1$. Also $H(Y\vert X)=a\,h_2(\epsilon)+(1-2a)\cdot1+a\,h_2(\epsilon)=2a\,h_2(\epsilon)+1-2a$. Hence
$$I(a)=1-\big[2a\,h_2(\epsilon)+1-2a\big]=2a\big(1-h_2(\epsilon)\big)$$
maximised at $a=\tfrac12$, giving $C=1-h_2(\epsilon)$. For $\epsilon=0.1$: $C=0.531$.

## ★★★ 6.9 2023 Q4 — three parts (10 marks)

*Q.* (1) A 3-input 2-output channel whose middle row is constant; (2) a 3-output channel whose rows are permutations, with parameters $\alpha$ (middle mass) and $\epsilon$ (cross mass); (3) a partially-noisy channel where an input allocation $(\tfrac12,\tfrac14,\tfrac14)$ is proposed.

(1) The constant row carries no information, so give it mass 0; the remaining inputs $\{0,2\}$ map deterministically to the two outputs, giving a perfect binary channel: $C=1$.

(2) Symmetric ⇒ $P_X=(\tfrac12,\tfrac12)$. The joint table is
$$\begin{array}{c|cc} & x=0 & x=1\\\hline y=0 & \tfrac{1-\alpha-\epsilon}{2} & \tfrac{\epsilon}{2}\\ y=e & \tfrac{\alpha}{2} & \tfrac{\alpha}{2}\\ y=1 & \tfrac{\epsilon}{2} & \tfrac{1-\alpha-\epsilon}{2}\end{array}$$
so $H(Y)=(1-\alpha)-\alpha\log\alpha-(1-\alpha)\log(1-\alpha)$ and $H(XY)=1-(1-\alpha-\epsilon)\log(1-\alpha-\epsilon)-\alpha\log\alpha-\epsilon\log\epsilon$. Subtracting ($\alpha\log\alpha$ cancels):
$$C=(1-\alpha)-(1-\alpha)\log(1-\alpha)+(1-\alpha-\epsilon)\log(1-\alpha-\epsilon)+\epsilon\log\epsilon.$$
Checks: $\alpha=\epsilon=0\Rightarrow1$; $\alpha=0\Rightarrow1-h_2(\epsilon)$; $\epsilon=1-\alpha\Rightarrow1-\alpha$; $\alpha=1\Rightarrow0$.

(3) With $P_X=(\tfrac12,\tfrac14,\tfrac14)$ one has $H(X)=H(Y)=\tfrac32$ and $H(XY)=\tfrac32+\tfrac12h_2(\epsilon)$, hence
$$C\ \ge\ I=\tfrac32-\tfrac12h_2(\epsilon).$$

## ★★★ 6.10 2024 Q2 — BPSK over AWGN (16 marks)

*Q.* $M\in\{\pm1\}$ uniform, $X=\pm\sqrt P$, $Y=X+Z$ with $Z\sim\mathcal N(0,\sigma^2)$; average power $P$.
$$M\xrightarrow{\ \text{map}\ }X\xrightarrow{\ +Z\ }Y\xrightarrow{\ \operatorname{sgn}\ }\hat M$$
$$!M\to X\to Y\to\hat M\quad\text{is a Markov chain (DPI)}$$

(a) Amplitude. $\tfrac12\big((\sqrt P)^2+(-\sqrt P)^2\big)=P$ ✓.

(b) ML rule. $p(y\vert m=\pm1)=\frac1{\sqrt{2\pi\sigma^2}}e^{-(y\mp\sqrt P)^2/2\sigma^2}$, so the larger density is the closer mean: $\hat m=\operatorname{sgn}(y)$.

(c) Error. When $+1$ is sent, $Y<0\iff Z<-\sqrt P$, so $p_{\rm err}=\Pr(Z<-\sqrt P)=\Phi(-\sqrt P/\sigma)$; symmetric messages make the other case identical.

(d) Criteria. $p_{\max}=p_{\rm avg}=p_{\rm err}$.

(e) Channel. $W(\hat m\vert m)=\begin{pmatrix}1-p&p\\p&1-p\end{pmatrix}$, i.e. $\mathrm{BSC}(p_{\rm err})$.

(f) Mutual information. $I=1-h_2(p_{\rm err})$. At $P=\sigma^2$: $p_{\rm err}=\Phi(-1)=0.159$, $h_2=0.631$, $I=0.369$.

(g) Compare. Gaussian capacity at the same SNR is $\tfrac12\log2=0.5$; $0.369<0.5$, so binary input is strictly suboptimal.

(h) DPI. $M\to X\to Y\to\hat M$ gives $I(W)=I(M:\hat M)\le I(X:Y)\le I(w,P)$.

# 7 · Noisy channel coding (Ch.7)

## ★★★ 7.1 Codes and criteria

$$?(2^L,n)\ \text{code: }e:\{0,1\}^L\to\mathcal X^n,\ d:\mathcal Y^n\to\{0,1\}^L$$

$$?R=\frac Ln$$


$$!p_{\rm avg}=\Pr[M\ne\hat M]=\frac1{2^L}\sum_mp_m$$

$$!p_{\max}=\max_mp_m$$

$$!p_{\rm avg}\le p_{\max}\le2^Lp_{\rm avg}$$

*Meaning:* the two criteria differ by the factor $2^L$; a bound on one is a bound on the other up to that factor — that is why expurgation costs only 1 bit.

## ★★★ 7.2 The coding theorem

$$!C(W)=I(W)$$


$$!R<I(W)\Rightarrow\exists\{\epsilon_n\}:\epsilon_n\to0$$

$$!R>I(W)\Rightarrow\epsilon_n\not\to0$$

$$!\limsup_n\epsilon_n<1\ \Rightarrow\ R\le I(W)$$


$$?\text{"error}\to1$$

*Pf.* (achievability): random codebook, $M=2^{nR}$, joint-typical decoding, $\mathbb E[p_e]\le2^{-n(I(W)-R)}+\epsilon$ ⇒ some code beats the average; expurgation kills the worst $2^{L-1}$ messages.

*Pf.* (converse): Fano on $M\to Y^n\to\hat M$: $nR=H(M)\le I(M:\hat M)+1+n\epsilon R\le nI(W)+1+n\epsilon R$.

## ★★★ 7.3 Separation theorem (Thm 7.8)

- <mark>Separation</mark> (Thm 7.8): reliable transmission over a channel with capacity $I(W)$ of a source with entropy $H(Z)$ is possible iff $H(Z)<I(W)$; equality is accepted (2024 Q1.6). Compress, then channel-code; joint design does not help.
- *Pf. (<mark>achievability</mark>):* pick $R$ with $H(Z)<R<I(W)$; compress at rate $R$ (source coding theorem, error $\to0$), then channel-code at $R$ (Theorem 7.1, error $\to0$); the union bound gives reliability.
- *Pf. (<mark>converse</mark>):* any scheme gives the Markov chain $Z^n-Y^n-\hat Z^n$, so $I(Z^n:\hat Z^n)\le I(Y^n:\hat Z^n)\le nI(W)$; Fano gives $H(Z^n\vert\hat Z^n)\le1+n\epsilon\log\vert\mathcal Z\vert$, hence $nH(Z)\le nI(W)+1+n\epsilon\log\vert\mathcal Z\vert$ and $H(Z)\le I(W)$ after dividing and letting $\epsilon\to0$.

## ★★ 7.4 One-shot and meta-converse

$$L\le\max_{P_X}\min_{Q_Y}\log\frac1{\beta_1^*(\epsilon;P_{XY}\Vert P_X\times Q_Y)}$$

$$\beta_1^*(\epsilon;P\Vert Q)=\min\{Q(\mathcal A):P(\mathcal A)\ge1-\epsilon\}$$

$$!p_{\rm err}\le\epsilon+2^L\beta_1^*$$


$$!\text{expurgation: }p_{\rm avg}\to p_{\max}$$

*Meaning:* a decoder is a hypothesis test between "output through $W$" and "output independent of input"; a good code forces a strong test, which caps $L$.

## ★★ 7.5 Power-constrained capacity

$$!C=\max_{P_X:\ \mathbb E[X^2]\le P}I(X:Y)$$

$$!\text{AWGN}\Rightarrow\tfrac12\log\Big(1+\frac{P}{\sigma^2}\Big)$$

$$!\text{discretisation: }I(X:Y)=\lim_{\Delta\to0}I(X^\Delta:Y^\Delta)$$

## ★★ 7.6 Typical-set decoding in five steps

1. Choose $P_X$ attaining $I(W)$ and generate $2^{nR}$ codewords i.i.d. $P_X$.
2. Send $m$; the decoder outputs the unique $\hat m$ with $(x^n(\hat m),y^n)\in T^n_\epsilon$.
3. An error means either the true pair is not jointly typical, or some other codeword is jointly typical.
4. Union bound: $\Pr[\text{other}]\le2^{nR}\cdot2^{-n(I(W)-\epsilon)}=2^{-n(I(W)-R-\epsilon)}$.
5. Thus $\mathbb E[p_e]\le\epsilon+2^{-n(I(W)-R-\epsilon)}\to0$ whenever $R<I(W)$.

## ★★★ 7.7 Statements to judge (one line each)

- An $(2^L,n)$ code has $R=L/n$; $p_{\rm avg}\le p_{\max}\le2^Lp_{\rm avg}$, so a bound on one criterion transfers to the other at the price of the factor $2^L$ (one bit).
- Coding theorem: for a DMC, $C(W)=I(W)$: $R<I(W)$ is achievable with $\epsilon_n\to0$, and $R>I(W)$ forces $\epsilon_n\not\to0$.
- <mark>Strong converse</mark>: even $\limsup_n\epsilon_n<1$ is impossible for $R>I(W)$. Hence "there exists a code with error $\to1$" says nothing about the rate — mapping every message to one codeword achieves it.
- $R=I(W)$ itself is achievable (the boundary is closed on the achievable side), so "with $\epsilon_n\to0$" holds there too.
- Additivity: $I(W_1\times W_2)=I(W_1)+I(W_2)$, hence $I(W^{\times n})=nI(W)$; using the channel twice doubles the <mark>capacity</mark>, it does not keep it.

## ★★★ 7.8 2023 Q5 — broadcast channel converse (8 marks)

*Q.* One sender with input $X$, two receivers with outputs $Y$ and $Z$, two independent messages $M_1,M_2$ at rates $R_1,R_2$. Show that any reliable scheme satisfies
$$R_1+R_2\le I(W_{YZ\vert X})$$

$$R_1\le I(W_{Y\vert X})$$

$$R_2\le I(W_{Z\vert X}).$$


(a) Sum rate. Merge $M=(M_1,M_2)$ into a single message of rate $R_1+R_2$; the two receivers together see $W_{YZ\vert X}$, which is an ordinary DMC. A reliable code for it must satisfy the strong converse, hence $R_1+R_2\le I(W_{YZ\vert X})$.

(b) Individual rates. Marginalise $M_2$: averaging over it turns the system into a single-user channel $W_{Y\vert X}$ carrying $M_1$, so $R_1\le I(W_{Y\vert X})$; symmetrically $R_2\le I(W_{Z\vert X})$.

(c) Why no construction is needed. All three bounds are converses: the exam asks only for the impossibility statements, obtained by merging (for the sum) and marginalising (for the parts).

# 8 · Learning-theory bounds (Ch.8) — 0 of 3 papers

## ★ 8.1 Sample complexity of learning a distribution

$$!n=\Theta\Big(\frac d{\epsilon^2}\Big)$$

$$!\mathbb E\,\delta_{\rm tvd}(P,\hat P)\le\tfrac12\sum_x\sqrt{\frac{P(x)}n}\le\tfrac12\sqrt{\frac dn}\ \Rightarrow\ n=\frac d{4\epsilon^2}\ \text{suffices}$$

$$?\text{lower bound: two-point perturbation, }\delta_{\rm tvd}=\epsilon,\ D\approx\epsilon^2$$

## ★ 8.2 Bandit regret

$$!R_n=n\mu^*-\mathbb E\Big[\sum_{t=1}^nX_t\Big]\qquad R_n^*=\inf_{\rm policy}\sup_{P}\mathbb E_P[R_n]$$

$$!R_n=\sum_a\Delta_a\mathbb E[T_n(a)]\qquad R_n^*\ge\frac1{27}\sqrt{(k-1)n}=\Omega(\sqrt{kn})$$

$$?\text{two-armed: }R_n^*\ge\tfrac1{864}\sqrt{n+1}\qquad \Delta=\sqrt{\tfrac{k-1}{4n}}\ \text{or}\ \tfrac1{\sqrt{n+1}}$$

## ★ 8.3 The three tools

$$!p(\mathcal A)+q(\mathcal A^c)\ge\tfrac12e^{-D(p\Vert q)}\quad\text{(Bretagnolle–Huber)}$$

$$?D(\mathbb P\Vert\mathbb P')=\sum_i\mathbb E[T_n(i)]\,D(P_i\Vert P_i')\quad\text{(divergence decomposition)}$$

$$?H(X\vert Y)\le h_2(\eta)+\eta\log\vert\mathcal X\vert\ \text{(Fano)}\qquad D\le\chi^2=\frac{(\mu-\mu')^2}{\mu'(1-\mu')}$$
