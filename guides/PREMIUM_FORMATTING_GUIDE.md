# MLT Premium Mathematical Formatting Guide

This document defines the premium mathematical typesetting standard used across all
MLT (Machine Learning Techniques) lecture notes. Follow these rules when creating
or editing any HTML file in this repository.

---

## Quick Start

Every lecture note HTML file must include:

### 1. KaTeX CDN (in `<head>`)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body, {
    delimiters: [
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false}
    ],
    macros: {
      '\\N': '\\mathcal{N}',
      '\\L': '\\mathcal{L}',
      '\\R': '\\mathbb{R}',
      '\\given': '\\mid'
    },
    throwOnError: false
  });">
</script>
```

### 2. Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### 3. CSS Variables

```css
:root {
  --bg: #f4f5f9;
  --surface: #ffffff;
  --ink: #1a1e2b;
  --ink-soft: #505770;
  --ink-faint: #8b91a5;
  --line: #dde0e9;
  --blue: #1e4f8a;
  --blue-soft: #e9eef7;
  --gold: #b5872a;
  --gold-soft: #f6ecd3;
  --gold-deep: #8f6a1c;
  --rust: #a8482a;
  --rust-soft: #f7e6df;
  --teal: #2c6b5d;
  --teal-soft: #e2efec;
  --purple: #5a3e8a;
  --purple-soft: #ede7f5;
  --green: #3d7a4a;
  --green-soft: #e6f0e8;
  --radius: 12px;
  --shadow: 0 1px 3px rgba(26,30,43,0.06), 0 8px 28px -12px rgba(26,30,43,0.16);
  --shadow-lg: 0 4px 32px -8px rgba(26,30,43,0.18);
}
```

---

## The 12 Rules

### RULE 1 — Equation Panels

Every major equation must appear inside a dedicated `.eq-panel` div.
Never place equations inside paragraphs.

**HTML structure:**
```html
<div class="eq-panel" id="eq-marginal">
  <span class="eq-num">Equation (1)</span>
  <div class="eq-label">Marginal Density</div>
  $$p(\mathbf{x}_i \mid \boldsymbol{\theta}) = \sum_{k=1}^{K} \pi_k \,
  \mathcal{N}(\mathbf{x}_i \mid \boldsymbol{\mu}_k, \sigma_k^2)$$
  <div class="eq-caption">The probability of one point is the weighted sum across every Gaussian component</div>
</div>
```

### RULE 2 — Break Large Equations

Never compress large equations into one line. Use `\\` for line breaks inside
KaTeX `\begin{aligned}` or similar environments. Use `.eq-panel.multiline` class:

```html
<div class="eq-panel multiline">
  <span class="eq-num">Equation (2)</span>
  $$\begin{aligned}
  \log \mathcal{L}(\boldsymbol{\theta}) &= \sum_{i=1}^{N} \log\!\bigl[ \sum_{k=1}^{K} \pi_k \mathcal{N}(\mathbf{x}_i \mid \boldsymbol{\mu}_k, \sigma_k^2) \bigr] \\
  &= \sum_{i=1}^{N} \log\!\bigl( \sum_{k=1}^{K} \pi_k \mathcal{N}(\mathbf{x}_i \mid \boldsymbol{\mu}_k, \sigma_k^2) \bigr)
  \end{aligned}$$
</div>
```

### RULE 3 — Vertical Derivations

Display derivations vertically with numbered steps. Use `.derivation-timeline`:

```html
<div class="derivation-timeline">
  <div class="dt-label">&#9654; Step-by-Step Derivation</div>

  <div class="dt-step">
    <div class="dt-num">1</div>
    <div class="dt-text">Start with the likelihood (product over points)</div>
    <div class="dt-formula">$\displaystyle \mathcal{L}(\boldsymbol{\theta}) = \prod_{i=1}^N p(\mathbf{x}_i \mid \boldsymbol{\theta})$</div>
  </div>
  <div class="dt-arrow">&#8595; <span style="font-size:12px;color:var(--ink-faint);">Take $\log$ of both sides</span></div>

  <div class="dt-step">
    <div class="dt-num">2</div>
    <div class="dt-text">Apply the log rule: $\log(\prod a_i) = \sum \log a_i$</div>
    <div class="dt-formula">$\displaystyle \log \mathcal{L}(\boldsymbol{\theta}) = \sum_{i=1}^N \log p(\mathbf{x}_i \mid \boldsymbol{\theta})$</div>
  </div>
</div>
```

### RULE 4 — Color-Code Mathematics

| Color   | Usage                 | CSS Variable     |
|---------|-----------------------|------------------|
| Gold    | Parameters, key terms | `var(--gold)`    |
| Teal    | Success, results      | `var(--teal)`    |
| Rust    | Errors, warnings      | `var(--rust)`    |
| Blue    | Information, concepts | `var(--blue)`    |
| Purple  | Functions             | `var(--purple)`  |
| Green   | Constants             | `var(--green)`   |

Apply via KaTeX `\color` or inline span styles.

### RULE 5 — Symbol Legend

Every equation must be followed by a `.legend-card` table:

```html
<div class="legend-card">
  <div class="leg-label">&#9654; Symbol Legend</div>
  <table>
    <thead>
      <tr><th>Symbol</th><th>Meaning</th><th>Example</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="leg-sym">$\mathbf{x}_i$</td>
        <td class="leg-meaning">A single data point</td>
        <td class="leg-example">$\text{Height} = 172\text{ cm}$</td>
      </tr>
      <tr>
        <td class="leg-sym">$\pi_k$</td>
        <td class="leg-meaning">Mixing coefficient</td>
        <td class="leg-example">$\pi_1 = 0.5$</td>
      </tr>
    </tbody>
  </table>
</div>
```

### RULE 6 — Oversized Operators

Always use `\displaystyle\sum`, `\displaystyle\prod`, `\displaystyle\int`,
`\displaystyle\iint`, `\displaystyle\iiint`, `\displaystyle\partial`,
`\displaystyle\nabla` inside inline math (display math already uses them).

### RULE 7 — Matrix Rendering

Never render matrices inline with brackets. Use `\begin{pmatrix}`:

```latex
$$
\mathbf{C} = \frac{1}{n} \begin{pmatrix}
\sigma_x^2 & \sigma_{xy} \\
\sigma_{yx} & \sigma_y^2
\end{pmatrix}
$$
```

### RULE 8 — Step Timeline for Derivations

Long derivations must use the same `.derivation-timeline` structure from Rule 3.
Label each step clearly and annotate arrows with the mathematical rule being applied.

### RULE 9 — Below Every Equation

Each equation must be followed by these 5 components in order:

1. **English explanation** (`.explain-card`):
```html
<div class="explain-card">
  <div class="ex-label">&#9654; Read the Equation in English</div>
  <div class="ex-text">
    &ldquo;The probability of observing data point $\mathbf{x}_i$...&rdquo;
  </div>
</div>
```

2. **Intuition** (`.intuition-card`):
```html
<div class="intuition-card">
  <div class="in-label">&#9654; Intuition</div>
  <div class="in-text">
    Imagine you hear a sound from behind a wall...
  </div>
</div>
```

3. **Numerical Example** (`.num-card`):
```html
<div class="num-card">
  <div class="num-label">&#9654; Numerical Example</div>
  <div class="num-setup"><strong>Setup:</strong> ...</div>
  <table class="num-tbl">...</table>
  <div class="num-result">$\displaystyle p(\mathbf{x}) = \mathbf{0.0577}$</div>
</div>
```

4. **Interpretation** (`.interpret-card`):
```html
<div class="interpret-card">
  <div class="int-icon">i</div>
  <div class="int-body">
    <strong>What this value means</strong>
    <p>A density of <strong>0.0577</strong> means...</p>
  </div>
</div>
```

5. **Common Mistakes** (`.mistakes-card`):
```html
<div class="mistakes-card">
  <div class="mis-icon">!</div>
  <div class="mis-body">
    <strong>Common Mistakes</strong>
    <p>&#x2716; <strong>Multiplying instead of adding:</strong> A GMM is a <em>sum</em>...</p>
  </div>
</div>
```

### RULE 10 — Mathematical Serif Typography

Use KaTeX for ALL mathematics. Never use `<span class="mono">` or monospace fonts
for equations. KaTeX automatically applies:
- Italic variables (e.g., $x$, $\mu$, $\theta$)
- Upright functions (e.g., $\log$, $\sin$, $\exp$)
- Proper subscript/superscript alignment
- Correct spacing around operators

### RULE 11 — Responsive Layout

The page must include these media queries at the bottom of `<style>`:

```css
@media (max-width: 820px) {
  .param-grid { grid-template-columns: 1fr; }
  .compare-grid { grid-template-columns: 1fr; }
  .apps-card .ap-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .container { padding: 0 18px; }
  main { padding: 40px 0 70px; }
  .eq-panel { padding: 24px 18px; }
  .eq-panel .katex-display > .katex { font-size: 1em; }
  .hero { padding: 52px 0 44px; }
  .sec-header h2 { font-size: 22px; }
}
@media (prefers-reduced-motion: reduce) {
  .cc-line.shake { animation: none; }
  html { scroll-behavior: auto; }
}
```

### RULE 12 — SVG Illustrations

For every important formula, create an SVG diagram inside a `.svg-card`:

```html
<div class="svg-card">
  <div class="svg-label">&#9654; Visual Flow Description</div>
  <svg viewBox="0 0 860 340" xmlns="http://www.w3.org/2000/svg">
    <!-- SVG content here -->
  </svg>
  <div class="svg-caption">Caption explaining what the diagram shows.</div>
</div>
```

Use inline SVG (not `<img>` tags). Include `<defs>` with arrow markers:
```html
<defs>
  <marker id="arrowG" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#8b91a5"/>
  </marker>
</defs>
```

---

## Page Structure Template

```
<body>

  <header class="hero">
    <!-- Dark gradient header with course info, title, nav pills -->
  </header>

  <main>
    <div class="container">

      <section class="section" id="s1">
        <div class="sec-header">
          <span class="sec-num">01</span>
          <h2>Section Title</h2>
        </div>
        <p class="sec-intro">Introduction paragraph...</p>

        <!-- EQUATION PANEL -->
        <!-- ENGLISH EXPLANATION -->
        <!-- SYMBOL LEGEND -->
        <!-- INTUITION -->
        <!-- STEP-BY-STEP DERIVATION -->
        <!-- SVG ILLUSTRATION -->
        <!-- NUMERICAL EXAMPLE -->
        <!-- INTERPRETATION -->
        <!-- COMMON MISTAKES -->
        <!-- APPLICATIONS -->
      </section>

    </div>
  </main>

  <footer>...</footer>

</body>
```

---

## CSS Component Summary

| Class                   | Purpose                              | Used with                           |
|-------------------------|--------------------------------------|-------------------------------------|
| `.eq-panel`             | Equation card (dark, gold border)    | `.eq-num`, `.eq-label`, `.eq-caption` |
| `.eq-panel.multiline`   | Multi-line equation variant          | —                                   |
| `.explain-card`         | English explanation                  | `.ex-label`, `.ex-text`             |
| `.legend-card`          | Symbol breakdown table               | `.leg-label`, `table.sym`           |
| `.intuition-card`       | Conceptual intuition                 | `.in-label`, `.in-text`             |
| `.num-card`             | Numerical example with calculations  | `.num-label`, `.num-tbl`, `.num-result` |
| `.interpret-card`       | What the value means                 | `.int-icon`, `.int-body`            |
| `.mistakes-card`        | Common misconceptions                | `.mis-icon`, `.mis-body`            |
| `.apps-card`            | Real-world applications grid         | `.ap-label`, `.ap-grid`, `.ap-item` |
| `.svg-card`             | SVG diagram container                | `.svg-label`, `.svg-caption`        |
| `.derivation-timeline`  | Step-by-step derivation              | `.dt-step`, `.dt-arrow`             |
| `.callout`              | Info/warning/good callout            | `.co-icon`, `.co-body`              |
| `.param-grid`           | Parameter cards grid (3 cols)        | `.param-card`                       |
| `.compare-wrap`         | Interactive comparison container     | `.compare-card`, `.cp-btn`          |
| `.code-block`           | Code with syntax highlighting        | `.cb-label`, `pre`                  |

---

## Best Practices

1. **Equation numbering**: Number equations sequentially as "Equation (1)",
   "Equation (2)", etc. per file.

2. **LaTeX macros**: Define commonly used macros in the `auto-render` config:
   - `\N` → `\mathcal{N}` (normal distribution)
   - `\L` → `\mathcal{L}` (likelihood)
   - `\R` → `\mathbb{R}` (real numbers)
   - `\given` → `\mid` (conditional)

3. **Bold vectors**: Use `\mathbf{x}` or `\boldsymbol{\mu}` for vectors/matrices.

4. **Whitespace in LaTeX**: Use `\,` for thin spaces, `\quad` for larger spaces
   around operators.

5. **Interactive elements**: Add JavaScript `<script>` blocks for interactive
   demos (like the log-sum comparison). Use animation sparingly and respect
   `prefers-reduced-motion`.

6. **SVG consistency**: Use the same color palette in SVGs as the CSS variables.
   Font in SVGs should be `'JetBrains Mono', monospace`.

---

## Reference File

The canonical reference implementation is:
```
Week 04 - Estimation GMM EM\L23 - Likelihood .html
```

Open this file in a browser to see the complete premium formatting in action.
Copy its `<style>` block and KaTeX setup as the starting template for any new file.
