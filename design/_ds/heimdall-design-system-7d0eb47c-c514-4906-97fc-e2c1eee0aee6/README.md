# Heimdall Design System

A design system for **Heimdall** — a graph-native knowledge studio and homelab control surface. Heimdall reads as a developer tool: dense, mono-accented, dark IDE chrome around a light "canvas" work surface. The system is deliberately calm and unflashy. Borders do most of the structural work; shadows are reserved for modals.

> Heimdall ships as `@tinkermonkey/heimdall-ui` (**v0.4.0**) — **75 exported React/TypeScript components** built on a CSS-custom-property token layer, the per-component CSS that styles them, and self-hosted Inter + JetBrains Mono. (A Tailwind theme mirrors the tokens, but the components style themselves with semantic, token-driven CSS classes — not utility soup.)

## Sources

This system was distilled from the [tinkermonkey/heimdall](https://github.com/tinkermonkey/heimdall) repository on GitHub, and a verbatim source mirror of the published package lives in this project under [`heimdall-ui/`](#heimdall-ui--the-real-package-loaded-from-source). Explore the repo directly for canonical token values, full component implementations, and visual regression baselines:

- **Repository:** https://github.com/tinkermonkey/heimdall (audited at SHA `d655fcd89e28`)
- **Canonical tokens:** `src/tokens/tokens.css`
- **Tailwind theme wiring:** `tailwind.config.ts`
- **Component implementations:** `src/components/` — 73 component source files exporting **75 components** (`Button`, `Chip`, `Badge`, `StatTile`, `Sidebar`, `Topbar`, `Modal`, `CommandPalette`, `GraphCanvas`, `LineChart`, `ChatMessage`, `InspectorPanel`, …).
- **Reference prototypes:** `design-reference/example-context-studio/` and `design-reference/example-homelab-dashboard/` — these are the high-fidelity visual spec.
- **Detailed color spec:** `design-reference/slate.md` (slate + amber palette reference, painted-by-token map).

If you have access, browse the repo at the URL above. If you don't, this folder contains the curated tokens, fonts, icons, a working UI kit, **and the real package source itself** — enough to design new artifacts that match the brand, or to build prototypes against the genuine components.

> **The component surface grew well past the original 28.** Older copies of this doc (and the repo's own `design-reference/`) still say "28 components" — that count is stale. The current barrel exports 75. The [Design ↔ Code Parity](#pages--surfaces) loop tracks where this space and the code still disagree.

---

## Products

Heimdall is a small product family with two reference surfaces:

1. **Context Studio** — a graph-native knowledge studio for building taxonomies, classes, properties, and Graph-RAG pipelines. Dark IDE chrome around a **light canvas** by default. Densely tabular, mono-accented; reads like a CLI man page rendered in HTML.
2. **Homelab Dashboard** ("asgard") — a monitoring and control dashboard for a 4-host homelab cluster with a persistent bot console. Same shell, **dark canvas** by default (monitoring context). 10-route nav: Overview, Servers, Containers, Network, Applications, Storage, Bots, Topology, Logs, Configuration.

Both products share one shell (`Sidebar` + `Topbar` + `Statusbar` + optional `Titlebar` + optional right `Drawer`/bot console) and one token system. The canvas surface is the only thing that varies in tone.

---

## Content Fundamentals

**Voice.** Calm, technical, terse. Reads like a CLI man page, not marketing copy. Short labels, no exclamation, no hand-holding. The product trusts the user to know what a "schema", "individual", "pipeline", or "MCP sidecar" is.

**Casing.**

- **Sentence case** for headings — "Knowledge graph", not "Knowledge Graph" (proper-noun exceptions: REST, JSON, ID, MCP, GPU).
- **UPPER + monospace** for section eyebrow labels — `SCHEMA`, `LAST RUN`, `WORKSPACE`, `PORTS`, `MOUNTS`, `UPTIME`. Always used *above* a value as an eyebrow, never as a full sentence.
- **Identifiers are always monospace, lowercase, snake_case** — `life.organism`, `cls_4f3a`, `pipeline.run.completed`, `nyx.lab.local`. Render them in `JetBrains Mono`.

**Pronouns.** Mostly impersonal — _"Add a class"_, _"Run pipeline"_, _"No data yet"_. Occasionally "you" in empty states (_"You haven't created any schemas"_). Never _we_, _us_, or _our_.

**Numbers and counters.** Tabular numerals, monospace, right-aligned in tables. Stat-tile numbers are 28–30px / 700 / `-0.02em`. Counters look like `12 / 480` or `+3 today`.

**Tone examples — copy these patterns verbatim:**

- **Empty state:** _"No individuals match these filters."_ &nbsp;❌ _"Looks like there's nothing here yet — try adjusting your filters!"_
- **Error toast:** _"`pipeline.run` failed — connection refused at step 2"_ &nbsp;(mono code in backticks, no apology)
- **Success toast:** _"Saved"_ / _"Class created"_ &nbsp;(one or two words)
- **Confirmation:** _"Delete `cls_organism`? 47 individuals will be unlinked."_ &nbsp;(state the consequence, don't ask _"Are you sure?"_)
- **Status line:** _"graph daemon :7474 · 22 classes · 267 individuals indexed · 1 pipeline running pubmed_genes 38%"_
- **Subtitle under H1:** _"Resource state across hosts, gateway health, and deployed services. All systems polled every 15 s."_

**Emoji.** Never. Ever. The visual language is line-icon + monospace.

**Unicode glyphs as icons.** Never — with one historical exception (CSS pseudo-element `→` in the pipeline-flow arrow). Add an icon to `assets/icons.jsx` instead.

---

## Visual Foundations

### Two-surface architecture (the defining choice)

Every screen is built from exactly two surfaces:

- **Shell** — sidebar, topbar, statusbar, optional titlebar, optional right drawer. **Always dark slate navy.** Doesn't change between modes.
- **Canvas** — the main work surface inside the shell. **Light by default** (`#FFFFFF`). Toggles to dark navy (`#0B1426`) via `body.dark-canvas`.

The canvas attaches to the shell with a single **`border-top-left-radius: 8px`** — a small notch in the corner that lets a wedge of the workspace gutter show through. No other corner radii on the canvas. That seam is the visual signature of the system.

| Surface           | Light canvas | Dark canvas |
| ----------------- | ------------ | ----------- |
| Shell base        | `#0F1729`    | `#0F1729`   |
| Sidebar / topbar  | `#13203A`    | `#13203A`   |
| Nav hover / cards | `#1B2949`    | `#1B2949`   |
| Canvas page       | `#FFFFFF`    | `#0B1426`   |
| Canvas inset      | `#F7F9FB`    | `#13203A`   |
| Canvas card       | `#FFFFFF`    | `#1B2949`   |

### Color

- **Primary accent: AMBER.** `--accent-primary` `#FBBF24` (bright) → `--accent-primary-hover` `#F59E0B` (hover) → `--accent-primary-deep` `#B45309` (CTA on light canvas). Reserved for: active nav indicator (2px left bar), focus rings, primary CTAs, env pills, version badges, tab underlines, selected node outline. (The variable names `--accent-cyan*` in the older reference are historical aliases for the amber set; new code should use `--accent-primary*`.)
- **Domain palette** — used to color taxonomies / classes / role marks / topology cards: emerald `#10B981` (life / compute / storage), amber `#F59E0B` (climate / GPU / vega), indigo `#818CF8` (software / k8s / aether), cyan `#22D3EE` (default / nyx).
- **Semantic intents:** emerald=ok/running/healthy, amber=warn/degraded, rose=error/failed/unhealthy, cyan=updating/pulling, violet=info-secondary, neutral gray=stopped/idle.
- **Saturation discipline.** No bright pastels on dark canvas — chip backgrounds drop to ~10% alpha tints. No gradient backgrounds on app surfaces. The only places gradients appear: the brand mark (amber → deep-amber 135°) and bot avatars in the homelab dashboard.

### Type

- **Sans:** **Inter** — every UI label, heading, body, button.
- **Mono:** **JetBrains Mono** — every identifier, path, IP, hostname, port, keyboard shortcut, eyebrow label, table header, status bar text, stat number.
- **Scale (Tailwind):** 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 / 60. Body default is **14px** (`text-sm`); page H1 is **24px** — much smaller than typical web, IDE density.
- **Weights:** 400 normal · 500 medium (most UI) · 600 semibold (headings, names) · 700 bold (page H1, stat numbers) · 800 extrabold (landing hero only).
- **Mono eyebrow labels** are **10–11px / 500 / `letter-spacing: 0.06–0.12em` / UPPERCASE**, color `var(--canvas-fg-3)`.
- **Heading letter-spacing:** tight — `-0.015em` to `-0.025em`.

### Shape

- **Radius — small.** 4–6px on most things (chips, buttons, inputs, kg-node). 8px on cards and panels. 10–12px on modals only. **No pill shapes** except the env pill and round dots.
- **Borders:** 1px hairline at low contrast (`var(--canvas-border)`, `var(--shell-border)`). Borders do most of the structural work.
- **Shadows:** almost never. Modal: `0 24px 64px -16px rgba(0,0,0,0.55)`. Toast: `0 14px 40px -16px rgba(0,0,0,0.5)`. Cards use **border only — no shadow**.

### Spacing

Tailwind 4px scale. Three density bands:

- **Compact** (table rows, nav items, metric rows): 8–10px vertical padding.
- **Standard** (panel headers, buttons, page padding): 12–14px.
- **Generous** (modal heads, page heads): 18–22px.

Canvas inner padding: `22px 26px 32px`. Stat-grid gap: 14px. Card internals: 16px. Min-width for `lab-canvas-inner` is 1100px — the canvas scrolls horizontally below that.

### Backgrounds & textures

- **No images, no gradients, no noise, no patterns on app surfaces.** Ever.
- **Hero (landing only):** two soft radial-gradient blooms (cyan top-left, violet bottom-right) at 12–18% alpha, behind a card.
- **Brand mark:** amber → deep-amber 135° linear gradient, with a stamped 3-dot pattern on the top half.

### Animation

Sparse and short. **80–180ms ease** for hovers and modals. The only continuous animation is the **status pulse** — `1.6s ease-out infinite scale 0.6→1.4 + opacity 0.5→0` on an absolutely-positioned glow circle behind a solid colored dot. Used exclusively to signal "live" / "connected". **No bouncy easing, no parallax, no scroll-driven motion, no transforms on press, no ripples.**

### Hover & press states

- **Nav items / table rows / chips:** background lifts **one neutral step** to `var(--shell-surface)` or `var(--canvas-bg-2)`. Never a color tint.
- **Buttons:** darken by ~10–15% (light bg) or move toward brighter amber (dark bg).
- **Active nav:** **2px amber bar at the left edge** + `shell-surface` background. Never a tint fill.
- **Press:** no transform, no scale-down, no ripple. Just background swap.

### Focus, selection

- **Focus ring:** `0 0 0 3px rgba(251, 191, 36, 0.18)` on inputs and buttons.
- **Text selection:** `rgba(251, 191, 36, 0.25)` (amber).
- **Row selection:** `rgba(251, 191, 36, 0.06)` bg + faint amber border.
- **Selected node** (kg-node, bot card in topology): 1px amber border + 1px amber outer ring.

### Layout primitives

- **Two-pane** (`SplitPane` / `.split-2`): main content + 380px right drawer.
- **Three-pane** (`.split-3`): 220px left + flex middle + 320px right.
- **Stat grid:** 4 columns × variable rows of stat tiles, each with a **2px colored left bar** keyed to the metric.
- **Sidebar:** 256px expanded, 64px collapsed (icons only).
- **Hierarchy tree:** mono node-pills with a 2.5–3px colored swatch on the left, dashed row dividers, indent steps of 18px.
- **Pipeline card:** flow strip with rounded nodes connected by 1px lines + 45°-rotated tip arrows.

### Transparency / blur

Rare. Only the focus ring uses an alpha background (`rgba(251, 191, 36, 0.18)`). Dark-canvas topbar search input uses `rgba(0,0,0,0.25)`. No backdrop-filter blurs anywhere — the modal backdrop is a flat `rgba(0,0,0,0.55)`.

### Imagery

Very little. The system is text + mono + line-icon. No photographic imagery on app surfaces. When a product needs an image (bot avatar, role mark), it's a **gradient tile with a 2-letter mono monogram** — never a photo.

---

## Iconography

**Single source: `assets/icons.jsx`** — a lookup `ICONS` map of SVG path strings, rendered through a tiny `<Icon name="…" size={16} />` component. The map is hand-rolled in the **Lucide outline style**: `24×24` viewBox, `strokeWidth="1.75"`, `stroke="currentColor"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"`.

**Filled exceptions** — only these four: `play`, `pause`, `zap`, `dot`. Everything else is outlined.

**Sizes:** 11–13px inside chips and palette items, 14–16px in nav and buttons, 18–22px in tile heads.

**Adding an icon = adding a key + path string to the `ICONS` map.** Never paste raw SVG into a component. Names are short and lowercase: `dashboard`, `schema`, `pipeline`, `graph`, `settings`, `search`, `bell`, `plus`, `chevDown`, `chevRight`, `play`, `pause`, `bot`, `brain`, `zap`, `globe`, `shield`, `cpu`, `layers`, `doc`, `folder`, `database`, `tag`, `table`, `flask`, `refresh`, `more`, `edit`, `check`, `x`, `expand`, `workflow`, `branch`, `history`, `sparkle`, `dot`.

**Emoji.** Never.
**Unicode glyphs as icons.** Never (one historical CSS-pseudo exception: pipeline-flow `→`).
**Icon libraries.** Lucide names match for ~90% of the set — if you swap to `lucide-react`, the rename is mostly mechanical.

The icon set ships in this folder as `assets/icons.jsx` (a JSX-ready React component plus the ICONS map) — copy it into your prototype's script tags directly, no install required.

---

## Pages & surfaces

This project is more than a static token sheet — it's a small set of working
HTML surfaces. Several look similar (they share the gallery chrome) but each
answers a different question. Here's what every page is for.

### Browse the components

- **`Component Gallery.html`** — the **reference browser**. Every component,
  grouped by category in the real Heimdall shell (sidebar + topbar + statusbar),
  with a light/dark **canvas** toggle. It renders fast, plain-JS `Bare*`
  re-creations (in `gallery/lib-*.js`) whose props deliberately mirror the real
  API. No build step, no transpile — open it to *see* the system. This is the
  everyday "what does the kit look like?" surface.

- **`Live Package.html`** — the **same gallery, rendered from the real package**.
  Instead of re-creations, it compiles the genuine `@tinkermonkey/heimdall-ui`
  source (vendored in `heimdall-ui/`) in the browser and renders the actual
  components — chrome included. It's the proof that prototypes can consume the
  real components, and a **stand-in for a CDN `<script>`** until the package is
  published. The statusbar shows live provenance (`source @ <sha> · N modules`).
  → See [`heimdall-ui/`](#heimdall-ui--the-real-package-loaded-from-source).

### Keep design and code honest (the parity loop)

- **`Design-Code Parity.html`** — the **adjudication dashboard**. It reads
  `sync/parity-manifest.json` (every token + component diff between this space
  and the code) and lets you walk the backlog: each entry shows the design value
  vs. the code value, a status (`in-sync` / `divergent` / `design-only` /
  `code-ahead` / `unaudited`) and a verdict (which side is canonical).
  Adjudications persist in `localStorage`. This is the canonical feedback loop —
  it supersedes the repo's old `design-reference/Feedback.md`. Maintenance recipe
  lives in `CLAUDE.md` and `sync/README.md`.

- **`Component Drift.html`** — the **side-by-side diff inspector**. For each
  component it paints the design-side rendering against the code-side rendering
  (using `gallery/code-*.css`) so you can *see* a divergence — a wrong pill
  radius, an off-by-one focus ring — rather than read about it. The visual
  companion to the parity dashboard.

### Specs & changelog

- **`charts-spec.html`** — the **charts design spec**. The 15-file chart system
  (Sparkline, LineChart, Bar*, StackedBar, Donut, Heatmap, StatusTimeline, …) is
  styled by TSX/SVG, not CSS, so it gets its own reference doc. Backed by
  `charts-spec/primitives.jsx` + `charts-spec/page.jsx`.

- **`design-system-update.html`** — a **point-in-time changelog**. Captures the
  14 new + 3 extended preview cards that came out of the Context Studio prototype
  review, each composed against existing tokens (no new colors/sizes/shadows).

---

## `heimdall-ui/` — the real package, loaded from source

A **verbatim source mirror** of the published `@tinkermonkey/heimdall-ui`
(`tinkermonkey/heimdall@d655fcd89e28`, v0.4.0) plus a tiny in-browser loader.
It exists so prototypes here can consume the **real** components — not
re-creations — before the package is published to a CDN.

- `*.tsx`, `*.ts`, `*.css` — the component / util / hook source + per-component
  stylesheets, flattened to unique basenames.
- `tokens.css`, `index.ts` — the token layer and the public API barrel.
- `manifest.json` — module + style lists and provenance (`version`, `repo`, `sha`).
- `loader.js` — `loadHeimdallUI()` fetches the source, transpiles TSX/TS → CJS
  with Babel standalone, resolves the relative module graph, injects the bundled
  CSS, and returns the real barrel as `window.HeimdallUI`.

It's a **drop-in stand-in for a CDN `<script>`**: once the package ships, a
consumer swaps the loader for the published ESM bundle + `./css` export and the
API is identical. Full notes and the refresh procedure live in
`heimdall-ui/README.md`.

---

## Index — what's in this project

| Path                       | What it is                                                          |
| -------------------------- | ------------------------------------------------------------------- |
| **Pages**                  |                                                                     |
| `Component Gallery.html`   | Reference browser — all components, fast `Bare*` re-creations.      |
| `Live Package.html`        | Same gallery rendered from the **real** vendored package source.    |
| `Design-Code Parity.html`  | Parity dashboard — adjudicate design↔code diffs (manifest-driven).  |
| `Component Drift.html`     | Side-by-side design-vs-code visual diff inspector.                  |
| `charts-spec.html`         | Design spec for the 15-file chart system.                           |
| `design-system-update.html`| Changelog of preview cards from the Context Studio review.          |
| **Docs**                   |                                                                     |
| `README.md`                | This document — the manifest, voice rules, and visual foundations.  |
| `CLAUDE.md`                | Project instructions + the parity-loop maintenance recipe.          |
| `SKILL.md`                 | Agent-skill manifest (cross-compatible with Claude Code).           |
| **Tokens & assets**        |                                                                     |
| `colors_and_type.css`      | The full token layer (CSS vars + semantic `h1/p/code/eyebrow`).     |
| `fonts/inter/`             | Inter — `.woff2` weights 300–900.                                   |
| `fonts/jetbrains-mono/`    | JetBrains Mono — `.woff2` weights 400/500/600.                      |
| `assets/icons.jsx`         | `<Icon>` component + `ICONS` path map (Lucide-style outline).       |
| `assets/brand-mark.svg`    | Heimdall amber-gradient brand mark (32×32 square).                  |
| `assets/wordmark.svg`      | Heimdall mark + "Heimdall · DESIGN SYSTEM" wordmark.                |
| `preview/`                 | Design-system preview cards registered in the Design System tab.    |
| **Code & parity**          |                                                                     |
| `heimdall-ui/`             | Verbatim source mirror of the real package + in-browser loader.     |
| `gallery/`                 | Shared JS/CSS for the gallery, live, and drift pages (registry, sections, `Bare*` libs, `code-*` CSS, loader plumbing). |
| `sync/`                    | Parity source of truth — `parity-manifest.json`, `dashboard.js`, and `code-snapshot/` (code side pinned at a SHA). |
| `charts-spec/`             | JSX primitives + page that back `charts-spec.html`.                 |
| `ui_kits/context-studio/`  | Heimdall Context Studio UI kit (shell + components + index.html).   |

---

## Caveats and substitutions

- **No font substitutions.** The repo ships self-hosted Inter (300–900) and JetBrains Mono (400/500/600). They live under `fonts/`. Don't link Google Fonts at runtime in production — match the repo's `@font-face` declarations.
- **Two reference apps; one canonical token set.** The older `homelab-dashboard/README.md` reference still describes cyan accent + `#0B0F14` shell tones. The production `src/tokens/tokens.css` and `design-reference/slate.md` are the source of truth — **amber accent, slate navy shell** as documented here. Treat any `--accent-cyan*` references in legacy CSS as aliases for the amber `--accent-primary*` set.
- **"28 components" is stale.** The barrel now exports **75**. Any doc — including the repo's own `design-reference/` — that still says 28 predates the Context Studio / homelab / chat / graph expansion. The [Design ↔ Code Parity](#pages--surfaces) loop is the live tally.
- **Icon names diverge between design and code.** This doc and `assets/icons.jsx` use short design-side names (`chevDown`, `more`); the code uses `chevronDown`, `moreVertical`. This is a tracked, unresolved divergence (the top risk for any real-component endpoint) — see the parity dashboard. When wiring `Live Package.html` against the real `Icon`, use the **code** names.
- **One UI kit shipped here.** The Context Studio kit covers the canonical chrome (sidebar, topbar, titlebar, statusbar, command palette) plus the dashboard surface (stat grid, panels, hierarchy, pipeline card). The Homelab Dashboard surface is a permutation of the same shell — see the repo for the full second surface.
- **`heimdall-ui/` is a pinned snapshot.** It mirrors the code at SHA `d655fcd89e28`. Re-vendor it (and `sync/code-snapshot/`) when the repo moves — refresh steps are in `heimdall-ui/README.md` and `CLAUDE.md`.
