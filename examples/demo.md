# Calculus & Algebra

> **Layout standard**
> Section colour = priority (★★★ red · ★★ green · ★ grey · ☆ light grey).
> Formula fill: `$$!` pink core · `$$` blue standard · `$$?` grey supporting.
> Priority is colour only: ★★★ red · ★★ green · ★ grey · ☆ light grey — there is no star font ladder.
> Rating basis: synthetic demo sheet, not derived from any course.
> **Meta:** angles in radians &middot; log means the natural log
> **Footer:** Demo sheet for the cheatsheet-pdf skill &mdash; every formula is self-contained.

# 1 · Algebra

## ★★★ 1.1 Quadratics

$$!x=\frac{-b\pm\sqrt{b^2-4ac}}{2a},\qquad \Delta=b^2-4ac$$

*Pf.* Complete the square: $a\big(x+\frac{b}{2a}\big)^2=\frac{\Delta}{4a}$; take roots.

*Meaning:* the discriminant decides the number of real roots before you solve anything.

$$?\Delta>0\Rightarrow2\ \text{real},\qquad \Delta=0\Rightarrow1,\qquad \Delta<0\Rightarrow0$$

## ★★ 1.2 Factorisation and logs

$$a^2-b^2=(a-b)(a+b),\qquad a^3\pm b^3=(a\pm b)(a^2\mp ab+b^2)$$

$$\log(xy)=\log x+\log y,\qquad \log\frac{x}{y}=\log x-\log y,\qquad \log x^n=n\log x$$

> **Trap.** $\log(x+y)\ne\log x+\log y$ — the most common algebra slip in an exam.

## ★ 1.3 Series

$$\sum_{k=1}^{n}k=\frac{n(n+1)}{2},\qquad \sum_{k=1}^{n}k^2=\frac{n(n+1)(2n+1)}{6}$$

$$?\sum_{k=0}^{\infty}r^k=\frac{1}{1-r}\ \ (|r|<1),\qquad \sum_{k=1}^{\infty}\frac{1}{k^2}=\frac{\pi^2}{6}$$

# 2 · Calculus

## ★★★ 2.1 Derivatives

$$!(fg)'=f'g+fg',\qquad \Big(\frac{f}{g}\Big)'=\frac{f'g-fg'}{g^2}$$

$$\big(f(g(x))\big)'=f'(g(x))\,g'(x)$$

*Meaning:* every differentiation rule is the chain rule plus one algebraic identity.

## ★★★ 2.2 Integrals

$$!\int u\,dv=uv-\int v\,du,\qquad \int_a^b f=\big[F\big]_a^b$$

$$\int\frac{dx}{x}=\ln|x|+C,\qquad \int e^{ax}dx=\frac{e^{ax}}{a}+C$$

## ★★ 2.3 Taylor and Taylor error

$$f(x)=\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(x-a)^k+R_n(x)$$

$$?|R_n(x)|\le\frac{M\,|x-a|^{n+1}}{(n+1)!},\qquad M=\max_{\xi}|f^{(n+1)}(\xi)|$$

*Pf.* Repeated integration by parts leaves the remainder in Lagrange form.

## ☆ 2.4 Common limits

$$?\lim_{x\to0}\frac{\sin x}{x}=1,\qquad \lim_{x\to0}\frac{e^x-1}{x}=1,\qquad \lim_{n\to\infty}\Big(1+\frac1n\Big)^n=e$$

# 3 · Linear algebra

## ★★★ 3.1 Determinants and inverses

$$!\det(A)=\prod_i\lambda_i,\qquad A^{-1}=\frac{1}{\det A}\,\mathrm{adj}(A)$$

$$?(AB)^{-1}=B^{-1}A^{-1},\qquad \det(AB)=\det A\det B$$

## ★★ 3.2 Eigenvalues

$$Av=\lambda v,\qquad \det(A-\lambda I)=0$$

*Meaning:* the characteristic polynomial turns an eigenproblem into root finding.

## ★ 3.3 Useful identities

$$?\|x+y\|^2=\|x\|^2+2\langle x,y\rangle+\|y\|^2$$

$$A^{\mathsf T}A\ \text{is symmetric and positive semi-definite}$$

> **Trap.** $\langle x,y\rangle=0$ means orthogonal, **not** independent — check the dimension first.

## ★ 3.4 Boundary cases

| Quantity | Zero iff | Maximum iff |
|---|---|---|
| $\det A$ | $A$ singular | $A$ orthogonal |
| $\lVert Ax\rVert$ | $x\in\ker A$ | $x$ along the top singular vector |
| $\operatorname{rank}A$ | $A=0$ | $A$ invertible |

# 4 · Trigonometry

## ★★★ 4.1 Identities

$$!\sin^2\theta+\cos^2\theta=1,\qquad \sin 2\theta=2\sin\theta\cos\theta$$

$$\cos 2\theta=\cos^2\theta-\sin^2\theta=1-2\sin^2\theta$$

*Meaning:* every double-angle identity follows from the addition formula with $\beta=\alpha$.

$$?\sin(\alpha\pm\beta)=\sin\alpha\cos\beta\pm\cos\alpha\sin\beta$$

$$\cos(\alpha\pm\beta)=\cos\alpha\cos\beta\mp\sin\alpha\sin\beta$$

## ★★ 4.2 Triangle rules

$$?\frac{a}{\sin A}=\frac{b}{\sin B}=\frac{c}{\sin C}=2R$$

$$c^2=a^2+b^2-2ab\cos C$$

> **Trap.** The law of cosines reduces to Pythagoras only when $C=90^\circ$; do not drop the
> cosine term because the triangle "looks right-angled".

## ★ 4.3 Inverse and hyperbolic

$$?\arctan x+\arctan\frac{1}{x}=\frac{\pi}{2}\ \ (x>0)$$

$$\cosh^2 x-\sinh^2 x=1,\qquad \frac{d}{dx}\tanh x=1-\tanh^2 x$$

# 5 · Probability and combinatorics

## ★★★ 5.1 Bayes and total probability

$$!P(A\mid B)=\frac{P(B\mid A)P(A)}{P(B)},\qquad P(B)=\sum_i P(B\mid A_i)P(A_i)$$

*Pf.* Write $P(A\cap B)$ both ways and divide by $P(B)$.

*Meaning:* the denominator is the normaliser; everything else is the definition of
conditional probability applied twice.

## ★★ 5.2 Expectation and variance

$$\mathbb{E}[X]=\sum_x x\,P(x),\qquad \operatorname{Var}X=\mathbb{E}[X^2]-\mathbb{E}[X]^2$$

$$?\mathbb{E}[aX+b]=a\,\mathbb{E}[X]+b,\qquad \operatorname{Var}(aX+b)=a^2\operatorname{Var}X$$

## ★★ 5.3 Counting

$$?P(n,k)=\frac{n!}{(n-k)!},\qquad C(n,k)=\frac{n!}{k!\,(n-k)!}$$

$$(x+y)^n=\sum_{k=0}^{n}C(n,k)x^k y^{\,n-k}$$

> **Trap.** $C(n,k)=C(n,n-k)$ but $P(n,k)\ne P(n,n-k)$ — order matters in one and not the
> other.

## ☆ 5.4 Useful bounds

$$?P(A\cup B)\le P(A)+P(B),\qquad P(A\cap B)\ge P(A)+P(B)-1$$

$$\big|\mathbb{E}[XY]\big|\le\sqrt{\mathbb{E}[X^2]\,\mathbb{E}[Y^2]}$$

