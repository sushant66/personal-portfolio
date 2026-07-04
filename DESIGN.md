# Design

Visual system for the redesigned portfolio. Direction: **engineered / structural** —
the page reads as a well-built system. Committed-restraint color strategy: ink on
near-white, one decisive signal, structure carried by grid and hairline rules rather
than fills or ornament.

## Theme

Light-primary, with a first-class dark mode. Physical scene: a hiring manager opening
the site on a laptop mid-workday with ten tabs open — a clean, high-contrast light
surface that reads instantly wins; dark mode is a respected alternative, not the default.
Honors `prefers-color-scheme` and a manual toggle.

Mood: a technical specification sheet or a considered systems diagram — precise,
legible, quietly confident. Not a magazine, not a terminal.

## Color

OKLCH throughout. Single signal color: **signal orange** — evokes engineering
annotation, signage, and diagram highlights; deliberately avoids both the SaaS-indigo
and terminal-green reflexes.

### Light
| Token | OKLCH | Role |
|---|---|---|
| `--bg` | `oklch(0.985 0.001 240)` | Page background (near-white, whisper cool — NOT cream) |
| `--surface` | `oklch(0.968 0.002 240)` | Raised panels, code/meta blocks |
| `--ink` | `oklch(0.20 0.012 255)` | Primary text (~15:1 on bg) |
| `--ink-2` | `oklch(0.44 0.012 255)` | Secondary/body text (~6.5:1) |
| `--ink-3` | `oklch(0.48 0.010 255)` | Muted metadata, ≥14px only (~5.5:1) |
| `--line` | `oklch(0.90 0.004 255)` | Hairline rules |
| `--line-strong` | `oklch(0.82 0.006 255)` | Emphasized rules, dividers |
| `--signal` | `oklch(0.64 0.19 45)` | Accent fills, marks, timeline nodes, focus |
| `--signal-text` | `oklch(0.50 0.15 42)` | Signal used AS text on light (~4.6:1) |

### Dark
| Token | OKLCH | Role |
|---|---|---|
| `--bg` | `oklch(0.20 0.008 255)` | Deep ink background (not pure black) |
| `--surface` | `oklch(0.24 0.010 255)` | Raised panels |
| `--ink` | `oklch(0.95 0.003 255)` | Primary text (~14:1) |
| `--ink-2` | `oklch(0.74 0.006 255)` | Secondary/body text (~6:1) |
| `--line` | `oklch(0.32 0.008 255)` | Hairline rules |
| `--signal` | `oklch(0.72 0.17 55)` | Accent (pops on dark, ~7:1) |

**Discipline:** the signal appears on active nav, link underlines/hover, timeline
markers, the leading impact figures, small grid "node" ticks, and focus rings — nowhere
else. Contrast is verified in-browser, not eyeballed. Orange is never small body text.

## Typography

Contrast axis: proportional grotesk vs monospace (both technical, no similar-but-not-
identical clash). Self-hosted via `@fontsource` — no external font CDN, better perf and
privacy, ideal on Vercel.

- **Display & headings — Archivo (variable, 500–800).** Structural grotesk with a
  technical edge. Hero at 700–800, tracking `-0.03em` (respects the `-0.04em` floor),
  `clamp()` max ≤ `5.5rem` (respects the 6rem ceiling). `text-wrap: balance` on h1–h3.
- **Body — Archivo (400–500).** Line-height 1.6, measure capped 65–72ch,
  `text-wrap: pretty` on prose.
- **Mono — Geist Mono.** Section indices, dates, tech tags, impact figures, metadata
  labels. Carries the "engineered" voice; the kicker system is mono, used sparingly.

Modular scale ~1.25. Flat scales read as uncommitted; step sizes are deliberate.

## Layout

- Content column max ~1120px on a **visible structural grid** — persistent hairline
  column margins / tick marks reinforce "engineered." Rules separate sections instead
  of alternating gray backgrounds.
- **Asymmetric hero:** name + one-line positioning left-weighted; a compact factual
  impact ledger (company · metric, in mono) aligned to a column beside/below it. Not
  the giant-number hero-metric template.
- **Experience (leads, per audience):** structured records — year + company as mono
  metadata in a narrow left column, role + quantified wins in the main column, hairline
  dividers. Numbered `01 / 02 / 03` — legitimate here, the career IS a sequence.
- **Selected work:** a differentiated list, not a clone card grid — mono index, title,
  one-line outcome, stack as mono tags, external links. No gradient icon-headers.
- **Skills / stack:** condensed categorized matrix in mono, not five identical cards.
  Devicon logos kept but tightened into a compact set.
- **About / Contact:** brief; about drops below the proof for the hiring audience.
- Flexbox for 1D, Grid for 2D. Responsive card rows via
  `repeat(auto-fit, minmax(280px, 1fr))` only where cards are genuinely right.
- Semantic z-index scale: `sticky-nav → backdrop → modal → toast → tooltip`.

## Motion

Intentional, restrained — motion proves precision, not playfulness.

- One orchestrated, **staggered** page-load reveal (not the uniform fade-up reflex);
  each reveal fits what it reveals. Content is visible by default — reveals enhance,
  never gate visibility (safe for reduced-motion and headless renders).
- Hairline rules may draw in; links and interactive elements get crisp, fast
  micro-interactions. Ease-out (quart/expo) curves; no bounce, no elastic.
- Every animation has a `prefers-reduced-motion: reduce` alternative (instant/crossfade).

## Components

Buttons (primary = ink fill / signal on hover, secondary = hairline outline; not glowing
pills), nav (sticky, hairline underline, mono links), timeline record, work row, stack
matrix, tech tag (mono chip, no side-stripe borders), theme toggle, footer. All built as
Astro components with tokens; no per-component magic values.

## Tech

Astro (static output), self-hosted fonts via `@fontsource-variable/archivo` +
`@fontsource/geist-mono`, Devicon for stack logos. Host-agnostic static build — deploys
to Netlify with zero config (build `astro build`, publish `dist`). Target: ~0 client JS
beyond a tiny theme-toggle + IntersectionObserver reveal script; Lighthouse 100 across
the board.
