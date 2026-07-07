------------------------------------------------
PREMIUM MATHEMATICAL TYPESSETTING
------------------------------------------------

Never render mathematical equations as plain text or inline code.

The notes should resemble a premium university textbook.

Mathematics should be the visual centerpiece of the page.

================================================
RULE 1
================================================

Every major equation must appear inside a dedicated Equation Panel.

The panel should contain

• Large centered equation
• Plenty of whitespace
• Soft elevated card
• Mathematical typography
• Responsive scaling
• Beautiful borders
• Accent colors
• Equation numbering

Example

────────────────────────────────

Maximum Likelihood

╭──────────────────────────────────────────────╮

                log L(θ)

        N
        Σ   log(...)
       i=1

╰──────────────────────────────────────────────╯

Equation (3.2)

────────────────────────────────

Never place equations inside paragraphs.

================================================
RULE 2
================================================

Never compress large equations.

Break them into readable lines.

Instead of

logL(θ)=Σlog(Σ...)

display

log L(θ)

=

Σ

log(

Σ

πₖ

N(xᵢ | μₖ , Σₖ)

)

Each mathematical operator should have visual spacing.

================================================
RULE 3
================================================

Display derivations vertically.

Instead of

A=B=C=D

display

Likelihood

↓

Take Log

↓

Apply Log Rule

↓

Differentiate

↓

Set = 0

↓

Solve

Every transformation gets its own card.

================================================
RULE 4
================================================

Color-code mathematics.

Example

Blue
• Variables

Gold
• Parameters

Green
• Constants

Purple
• Functions

Red
• Important operators

The same symbol should always use the same color.

================================================
RULE 5
================================================

Every equation must include a symbol legend.

Example

μ     Mean

Σ     Covariance

π     Mixing coefficient

θ     Model parameters

N     Gaussian distribution

================================================
RULE 6
================================================

Whenever an equation contains

Σ

Π

∫

∂

∇

matrix

vector

covariance

display them using oversized mathematical typography.

They should immediately stand out visually.

================================================
RULE 7
================================================

Matrices must never appear inline.

Render them as proper grids.

Example

│2 1│

│4 7│

instead of

[[2,1],[4,7]]

================================================
RULE 8
================================================

Long derivations should use a step timeline.

Example

Step 1

Likelihood

↓

Step 2

Take Log

↓

Step 3

Expand Product

↓

Step 4

Simplify

↓

Step 5

Differentiate

↓

Step 6

Final Formula

================================================
RULE 9
================================================

Below every equation include

• English explanation

• Visual intuition

• Numerical example

• Practical interpretation

• Common mistakes

================================================
RULE 10
================================================

Never use monospace fonts for equations.

Use mathematical serif typography.

Variables should be italic.

Functions upright.

Subscripts and superscripts must be aligned properly.

================================================
RULE 11
================================================

For responsive layouts

Large equations should automatically

• wrap intelligently

• stack vertically

• never overflow

• never shrink until unreadable

================================================
RULE 12
================================================

For every important formula create an SVG illustration that visually explains the equation.

Examples

GMM

Component 1

↓

Weighted

↓

+

↓

Component 2

↓

Weighted

↓

+

↓

Component K

↓

Final Probability

MLE

Observed Data

↓

Likelihood

↓

Log

↓

Optimization

↓

Best Parameters

SVM

Points

↓

Margins

↓

Hyperplane

↓

Maximum Margin

Linear Regression

Features

↓

Weighted Sum

↓

Prediction

↓

Loss

↓

Gradient

------------------------------------------------
FINAL GOAL
------------------------------------------------

The mathematical sections should look comparable to

• MIT OpenCourseWare
• Stanford CS notes
• DeepMind research visualizations
• Apple Books
• Premium scientific textbooks

A student should be able to understand the mathematics visually before reading the explanation.