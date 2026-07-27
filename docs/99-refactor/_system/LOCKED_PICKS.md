# AppBase_REFACTOR — Locked Component Picks (W17)

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT — **🔁 Second aesthetic reversal recorded** (see "2026-07-25 — The Kopi Studio cream/brown light theme" entry at the end of this file): the light cream/brown Kopi palette supersedes the navy/gold dark theme, which had itself superseded the slate-CTA/red-accent/zinc-page values on 2026-07-14. **Token NAMES remain locked through both reversals — only values moved.** Previous: 2026-04-19 — **🟢 W17 closed · X6 ✅ committed.** v1+v2+v3 all locked, handed off to W07 (primitives) + W08 (tokens).
**Status**: 🟡 Structural picks current · **visual values superseded twice** (see the two reversal entries at the end)
**Priority**: 🔴 Critical

## 📋 Overview

Canonical record of every visual-language pick the user has accepted via `/design-lab`. This file is the **handoff artefact for W07 (primitives) and W08 (tokens)** — once a slot's pick is here, W07 wraps it and W08 styles it.

> ⚠️ **Read the era markers before trusting a hex.** The tables in the 2026-04-19 body below record the *AppBase slate/zinc/red* era and are historical; the colour values were re-pointed to navy/gold on 2026-07-14 and again to Kopi cream/brown on 2026-07-25. **Component picks, token names, radii, motion and spring constants are still live; every colour in the original tables is not.** Current palette: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) · live values: [src/index.css](../../../src/index.css).

**Pick is durable** — surviving even if `/design-lab` is later removed. Locked picks are not re-litigated except by explicit user reversal.

## 📚 Related Documentation

- [W17_COMPONENT_LIBRARY.md](workflows/W17_COMPONENT_LIBRARY.md) — workflow card
- [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md) — per-primitive Design · Impl · Adopted state (replaces the removed `research/COMPONENT_INVENTORY.md` + `research/COMPONENT_CANDIDATES.md`; there is no `_system/research/` folder)
- `/design-lab` — the route the picks were made in. **Not in `src/App.tsx` any more**; the lab is gone, the picks below are the surviving record.
- [W07_SHARED_PRIMITIVES.md](workflows/W07_SHARED_PRIMITIVES.md) — consumes these picks
- [W08_DESIGN_SYSTEM.md](workflows/W08_DESIGN_SYSTEM.md) — tokens style these picks

---

## How to read this

| Column | Meaning |
|---|---|
| **Slot** | The W17 component slot |
| **Pick** | Winning candidate the user accepted |
| **Source** | Library / origin of the pick |
| **Locked on** | SGT date the user committed |
| **W07 follow-up** | What W07 has to build to wrap this pick into a primitive |
| **W08 follow-up** | What W08 has to tokenise (colours, spacing, motion timing) |

---

## v1 — locked 2026-04-19 SGT

| Slot | Pick | Source | Locked on | W07 follow-up | W08 follow-up |
|---|---|---|---|---|---|
| **Card** | `shadcnblocks-clean` — soft border, subtle hover lift, tighter typography | [shadcnblocks.com](https://www.shadcnblocks.com/components) | 2026-04-19 | Wrap as `<Card>` primitive replacing current `src/components/ui/card.tsx` consumers (250+ files). Variants: `default`, `interactive` (hover lift on). | Tokens: `--card-radius` (current 1rem), `--card-border` (zinc-200/80), `--card-shadow-rest` (1px 2px 4%), `--card-shadow-hover` (4px 16px 6%), `--card-padding` (1.25rem). |
| **DataTable** | `TanStack + Motion row enter/exit` — shadcn markup + headless engine + `AnimatePresence` on filter | [@tanstack/react-table](https://tanstack.com/table/latest) + [motion.dev](https://motion.dev/docs/react-animate-presence) | 2026-04-19 | Build `<DataTable columns rows>` primitive over shadcn `<Table>` + TanStack `useReactTable`. Bake-in `AnimatePresence` on rows (180ms ease). Replaces 88 hand-rolled list views — top W07 leverage move. | Tokens: `--row-hover-bg` (zinc-50 / dark zinc-900/50), `--row-enter-duration` (180ms), `--sort-icon-opacity-rest` (0.4). |
| **KPITile** | `Tremor + NumberTicker` — Tremor card shape + Magic UI count-up animation | [@tremor/react](https://www.tremor.so) + Magic UI NumberTicker (shipped as [src/components/primitives/dashboard/NumberTicker.tsx](../../../src/components/primitives/dashboard/NumberTicker.tsx); the `src/features/design-lab/` prototype it was sourced from no longer exists) | 2026-04-19 | Build `<KpiTile label value delta icon trend>` primitive. NumberTicker bundled. Sparkline slot accepts Tremor `<SparkAreaChart>` for v2 charts work. | Tokens: `--kpi-radius` (1rem), `--delta-positive-bg/fg` (green-50/700), `--delta-negative-bg/fg` (red-50/700), `--ticker-spring-stiffness` (100), `--ticker-spring-damping` (60). |

**v1 mockup proven against**: Quotation List (`src/features/design-lab/mockups/QuotationListMockup.tsx` — ⛔ the design-lab feature was removed; mockup no longer in the repo) — Desktop + Mobile-375px, in the then-current light/dark pair.

---

## v2 — locked 2026-04-19 SGT

| Slot | Pick | Source | Locked on | W07 follow-up | W08 follow-up |
|---|---|---|---|---|---|
| **Drawer** | `vaul + Motion handle pulse` — vaul bottom-sheet with grab-handle pulse on first paint to teach the swipe gesture | [vaul](https://vaul.emilkowal.ski) + [motion.dev](https://motion.dev) | 2026-04-19 | Build `<MobileDrawer>` primitive over vaul. Default snap point. Handle-pulse fires once per session. Replace 4 Sheet imports + introduces mobile bottom-sheet across supervisor flows. | Tokens: `--drawer-radius` (1rem top), `--drawer-handle-w` (40px), `--drawer-handle-h` (6px), `--drawer-overlay` (rgba 0/40), `--handle-pulse-duration` (1.6s once). |
| **Stepper** | `Animated chip stepper` — spring-eased active chip + check-mark morph on complete | motion + tailwind | 2026-04-19 | Build `<Stepper steps current onStepClick>` primitive. Replaces hand-rolled steppers in supervisor `addworkentry` / `otentry` / `generalworks`. | Tokens: `--chip-size` (28px / 24px compact), `--chip-active` (red-700), `--chip-done` (green-600), `--chip-spring-stiffness` (320), `--chip-spring-damping` (24). |
| **Timeline** | `Scroll-beam (Aceternity-style)` — connecting beam fills as you scroll · signature crazy-motion moment | motion `useScroll` (Aceternity-style, no paid dep needed — built inline) | 2026-04-19 | Build `<Timeline events>` primitive. Beam style is the default. Bespoke flex-stack variant available via `motion='off'` prop for in-table inline use. Replaces 4 duplicate `*StatusTimeline.tsx`. | Tokens: `--timeline-rail-color` (zinc-200/800), `--timeline-beam` (red-700 → transparent gradient), `--timeline-dot-size` (28px), `--timeline-step-gap` (20px). |
| **Charts** | `Tremor + Motion entrance` — Tremor's soft-fill area/bar charts with Motion-driven path-draw on first paint · signature dashboard moment | [@tremor/react](https://www.tremor.so) + motion | 2026-04-19 | Build `<Chart kind data series>` primitive over recharts (Tremor's underlying lib). Default `isAnimationActive=true` for dashboard-mounted charts, `false` for in-tooltip mini charts. | Tokens: `--chart-pipeline` (red-700 #b91c1c), `--chart-accepted` (green-600 #16a34a), `--chart-grid-dasharray` (2 4), `--chart-anim-duration` (800ms), `--chart-anim-stagger` (200ms). |

**v2 mockup proven against**: SupervisorWorkEntry mobile + EOS Dashboard (`src/features/design-lab/mockups/` — ⛔ removed with the design-lab feature) — Desktop + Mobile-375px, in the then-current light/dark pair.

**Known v2 caveat**: vaul drawer + shadcn Sheet both portal to `document.body`, so when opened inside the 375px mockup frame they render at full lab width. The drawer's **style** (handle, animation, content) is judgeable but the width context isn't realistic. Fixable in W07 by passing the canvas `ref` as the portal `container`.

---

## v3 — locked 2026-04-19 SGT (cross-cutting patterns, not per-slot)

These three patterns affect every mockup and are NOT slot-bound — they're page-level visual decisions that W07 + W08 must honour.

### v3.1 — CTA pattern (primary buttons across the app)

| Decision | Spec | Why |
|---|---|---|
| **Primary CTA = strong grey near-black** | **`bg-slate-700` (light: #334155, hsl 215 25% 27%)** hover `slate-800` · `bg-slate-100` (dark: #f1f5f9) hover white · text contrasts (white/slate-900). White-on-slate-700 contrast **10.7:1 WCAG AAA**. | User: "too red" twice. Heavy red as solid CTA fights the calm shadcnblocks-clean direction. Linear / Vercel / Stripe pattern: dark grey CTA, brand colour as accent only. **v3.1 amendment 2026-04-19**: zinc-700 → slate-700 (brief slate-500 trial 2026-04-19 eod+8 rejected on contrast — 4.14:1 borderline AA — reverted to slate-700 for AAA compliance + slightly warmer grey than zinc). |
| **Brand red kept as ACCENT only** | `red-700` (#b91c1c) for: status badges (rejected, current step), notification dots, focus rings, picker selection, chart legend pips, stepper progress beam, current-step timeline marker | High-signal moments where red carries meaning. Drops heavy red presence ~70% vs solid red CTA. |

**W07 follow-up**: rebuild `Button` primitive variants — `<Button variant='primary'>` = slate-700 (was red-600 in DESIGN_SYSTEM.md, briefly zinc-700 in v3.1 draft). Add `variant='destructive'` for delete/dangerous (red-700 SOLID — only place solid red survives). Default action stays grey.
**W08 follow-up**: tokens — `--cta-primary-bg` (slate-700 #334155), `--cta-primary-bg-hover` (slate-800), `--cta-primary-fg` (white), `--cta-destructive-bg` (red-700), `--brand-red` (red-700 — accent), `--accent-red-soft` (red-50/red-700 text — for badge backgrounds). Update CLAUDE.md "monochrome + red" rule to clarify "red as accent, not solid CTA".

### v3.2 — Glass surface pattern (sticky headers, future modal backdrops)

| Decision | Spec | Why |
|---|---|---|
| **Sticky page header = thin translucent glass** | `sticky top-0 z-20 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60` · h-12 · contains page title + search/bell icon row | Linear/Vercel pattern. Premium feel without warp/halo. Replaces today's `DashboardHeader` chunky implementation. |
| **Subtle page-background gradient** | `bg-gradient-to-br from-white via-blue-50/30 to-rose-50/20` (light) · `from-zinc-950 via-zinc-900/80 to-zinc-950` (dark) | Gives translucent surfaces something to blur over. Barely visible — doesn't fight content. |
| **Optional translucent Card variant** (4th Card candidate added but Card slot stays on `shadcnblocks-clean`) | `backdrop-blur-sm bg-white/70 border-white/60` · flat thin · NO shadow halo · NO warp | Available for premium/marketing surfaces (login splash, hero cards). Dense data surfaces (tables, forms) stay opaque shadcnblocks-clean. |

**W07 follow-up** *(⛔ superseded 2026-07-25 — both `<AppHeader>` and `DashboardHeader` were deleted with the top masthead; the sticky glass header pattern above is retired with them. Desktop chrome is now the `AppSidebar` rail. See [DEPRECATIONS.md](DEPRECATIONS.md))*: build `<AppHeader>` primitive replacing `DashboardHeader` (mandated currently on ~80 pages). Add `<Card variant='translucent'>` as opt-in. Don't migrate dense-data pages to translucent — only marketing-y / hero / dashboard surfaces.
**W08 follow-up**: tokens — `--surface-translucent-bg` (rgba 255/255/255/0.7), `--surface-translucent-blur` (4px), `--surface-translucent-border` (rgba 255/255/255/0.6), `--page-gradient-light` (from-white via-blue-50/30 to-rose-50/20), `--page-gradient-dark` (zinc deep). Glass header uses same translucent token family.

### v3.3 — Mobile data-table pattern (responsive layout)

| Decision | Spec | Why |
|---|---|---|
| **Tables → stacked card-rows on mobile (< 640px)** | 3-col grid per row: `(Number / Client) · (Status / Amount) · (Date)` · no horizontal scroll · driven by container/viewport state, not Tailwind `md:` breakpoints (since the lab proved Tailwind `md:` fires on viewport not container) | User spec: "for mobile view dont want any horizontal scroll · table full width · stacking information". Desktop tables stay horizontal. |
| **Mobile page padding = edge-to-edge** | Inner mockup container = `p-3` (12px) on mobile vs `p-6` (24px) on desktop · cards extend close to phone bezel | iOS / Android pattern. "Card inside a card" looks weird at 375px. |
| **Floating CTA on mobile lists** (NEW 2026-04-19 Session 1) | Bottom-right pill · 48px · `--cta-bg` · `--floating-shadow` · sticky above pagination · "` +` icon + verb" label ("New", "Add", etc.) | User spec 2026-04-19: "Mobile floating CTA globally". Primary action stays in thumb reach instead of being lost above the fold. Replaces the need for visible "+ New" button in mobile header. |

**W07 follow-up**: `<DataTable>` primitive owns its own mobile-stacked-rows layout. Default breakpoint at 640px container width (use container queries OR an explicit `compact` prop driven by `useMediaQuery`). The 3-col stacked spec is the DEFAULT mobile shape — applies to ALL list views once primitive lands. NEW: `<FloatingCTA>` primitive (4-line hierarchy per stacked card; pill sticky bottom-right) — reusable across all mobile list views.
**W08 follow-up**: tokens — `--mobile-page-padding` (12px), `--row-card-gap` (6px), `--row-card-border` (zinc-200/zinc-800). NEW (Session 1): `--floating-shadow` + the v4 status-badge palette + `--row-selected` (red-bar left-strip selection) + `--surface-subtle` + `--border-soft`/`--border-faint` for finer layering.

---

## What W17 explicitly DID NOT decide (deferred to W08)

These are token-value / shade-of-thing decisions the user wisely deferred to W08 rather than tuning in the lab:

- Exact hex of brand red (settled at `red-700` #b91c1c for now — W08 may pick a more brand-specific custom red)
- ~~Exact zinc-700 shade for CTAs (#3f3f46 — W08 may pick zinc-600 or zinc-800 ±1 step)~~ — **RESOLVED 2026-04-19**: primary CTA locked at `slate-700 #334155` (hsl 215 25% 27%), 10.7:1 AAA contrast. See table row above.
- Type scale (font sizes, weights, line heights — currently using Tailwind defaults)
- Spacing scale (currently Tailwind defaults — W08 may tighten or loosen)
- Geist font adoption (REFACTOR_BEST_PRACTICES locked Geist Sans + Mono + Instrument Serif but lab is using system-ui — Geist swap is W08 work)
- Dark-mode token rollout app-wide (lab has dark mode toggle but app currently hardcodes light only — W08 tokenises)
- Aurora / signature-moment background treatments (Aceternity-style — deferred until specific page needs it)

---

## Slots NOT yet judged (queued for v3+)

---

## Slots NOT yet judged (queued for v3+)

These slots either need a /design-lab session OR the recommendation is "shadcn baseline, no choice" (no need to lab them).

### v3 candidates (smaller / less visible)

| Slot | Why later |
|---|---|
| EmptyState | Build in W07 from shadcn pieces — only worth a slot if you want to compare illustration styles |
| FileUploader | Defer until W13 — depends on supervisor mobile + NAS constraints |
| MultiSelect wrapper | Build in W07 from `SearchableSelect` — no real candidate choice |
| Sidebar | Only if we commit to an app-wide navigation rewrite (currently page-grid) |

### Slots staying shadcn baseline — no lab needed

Form root · Tabs · Dialog · AlertDialog · Popover · Tooltip · DropdownMenu · ContextMenu · Sonner toast · Alert · Skeleton · Input · Textarea · Checkbox · Radio · Switch · Select · SearchableSelect (in-repo, mandated) · Calendar · Combobox · ScrollArea · AspectRatio · Separator · Avatar · Badge · Progress · breadcrumb (adopt) · DashboardHeader (in-repo) · GlobalCommandPalette (in-repo) · navigation-menu (skip)

These commit to shadcn at X6 ✅ time — no lab session needed. Recorded in the (since-removed) `research/COMPONENT_CANDIDATES.md`; the surviving record is [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md).

---

## X6 commit criteria — ALL MET 2026-04-19 ✅

- [x] All v1 slots locked (Card · DataTable · KPITile) — **2026-04-19 ✅**
- [x] All v2 slots locked (Drawer · Stepper · Timeline · Charts) — **2026-04-19 ✅**
- [x] All shadcn-baseline slots batch-confirmed by user — **2026-04-19 ✅** ("let the rest of the design in W08")
- [x] At least 2 mockups validate the picks compose into real pages — **3 mockups live** (Quotation List ✅ · SupervisorWorkEntry mobile ✅ · EOS Dashboard ✅)
- [x] User explicitly says "this is the look" — **2026-04-19 ✅** ("looks good looks good · roughly there")

**X6 ✅ COMMITTED.**

Cascade:
- W17 → 🟢 PRODUCTION (this card)
- DAG flag `components_chosen` SET
- W07 (primitives) — unblocked, can start writing primitives that wrap the locked picks
- W08 (tokens) — unblocked, can extract token values from the spec rows above
- DESIGN_SYSTEM.md — formally deprecated (the Tadao Ando minimalism rule is now superseded by W17's "calm shadcnblocks-clean + Linear/Vercel-style premium accents" direction)

---

## 2026-07-14 — Editorial navy/gold/serif dark theme (USER-APPROVED REVERSAL)

**Decision**: the Prospect Profiler / Insurance CRM "Editorial" aesthetic — navy `#0D1B2A` canvas · raised-navy surfaces (`#12202F` card, `#182638` modal) · gold `#C9A84C` primary CTA + accent + focus ring · cream `#F0EAD6` text · Georgia serif display — is now the system of record. This is the explicit user reversal (2026-07-14 redesign PRD) that this file's "not re-litigated except by explicit user reversal" clause anticipated.

**Superseded visual locks** (values only — see "What remains" below):
- v3.1 CTA: slate-800 `#1e293b` primary (slate-700 final pick) → **gold `#C9A84C`** with near-black-brown `#1A1200` text; hover slate-900 → **lighter gold `#D9BC6A`**.
- v3.1 brand accent + focus ring: red-700 `#b91c1c` → **gold `#C9A84C`** (`--brand-red` keeps its NAME but holds gold; solid red is destructive-only, now DISC-D `#C0392B`).
- v3.2 page backdrop: zinc-100 light / zinc-900 dark `--page-bg` → **flat navy `#0D1B2A`**, always dark (ThemeProvider pins `resolved='dark'`).
- v1 Card / DataTable / KpiTile, v2 Drawer / Stepper / Timeline / Charts, v3.3 mobile, v4.x surface/text/row/skeleton/shadow/status-badge values: zinc/white/red-green light-era values → navy/gold/cream equivalents (semantic meaning preserved: positive deltas stay green, negative stay red, tuned for navy contrast; borders from `hsl(210 25% 24%)`).
- Sidebar tokens: light `0 0% 98%` → navy/gold set.
- W08 font locks (Roboto body · Geist Mono subheaders · Geist Pixel display): superseded 2026-07-07 de-AppBase → system-ui body + Georgia serif display (recorded here for completeness).

**What remains locked**: every token NAME (`--cta-primary-bg`, `--brand-red`, `--page-bg`, `--status-*`, v1/v2 structural tokens, radii, motion durations, spring constants) — primitives consume names, not values. Structural picks (Card/DataTable/KpiTile/Drawer/Stepper/Timeline/Charts component choices) also stand.

**Source of truth** *(as of 2026-07-14 — superseded, see the next entry)*: `src/index.css` `:root` (LOCKED_PICKS blocks retuned in place; `.dark` no longer overrides them — app is always dark) + `src/lib/design/tokens.ts`.

---

## 2026-07-25 — The Kopi Studio cream/brown light theme, direction 2a "Kopi House" (USER-APPROVED REVERSAL)

**Supersedes**: 2026-07-14 — Editorial navy/gold/serif dark theme.

**Decision**: the app is **light-pinned** on The Kopi Studio brand card, direction 2a — warm cream `#F0E6D6` canvas · card `#FAF6EE` · raised white `#FFFFFF` · warm ink `#3A2E24` · brown `#8B6A47` primary CTA + focus ring + active-nav marker · sage `#5A7A5E` positive · terracotta `#D97551` negative · hairline `#D9CCC0` · Instrument Serif headings over IBM Plex Sans body. **There is no navy and no gold in this brand.** Authoritative spec: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md).

**Superseded visual locks** (values only — names still frozen):
- v3.1 CTA: gold `#C9A84C` → **brown `#8B6A47`** with card-cream `#FAF6EE` label (4.58:1); hover `#7D5F3D`, pressed `#6D5233`.
- v3.1 brand accent + focus ring: gold → **brown**. `--brand-red` keeps its NAME but now holds the AA-safe brown `#806241`, because most consumers paint it as small text. Destructive is AA-safe terracotta `#AB4925` (raw `#D97551` fails at 2.95:1 under a cream label).
- v3.2 page backdrop: flat navy → **flat cream `#F0E6D6`**; ThemeProvider pins `resolved='light'` and keeps the `dark` class off `<html>`.
- v2 Charts: gold + green two-series → **one brown ramp, four steps** (`#8B6A47` → `#A58868` → `#C0A68C` → `#DCCBB6`), assigned by series order. No sage, no terracotta, no categorical hues in viz — those stay semantic.
- v4.6 status palette: six saturated hue families → **three meanings** (sage positive · brown in-progress · terracotta error) plus muted neutrals for inert states, as tint fills with darkened same-hue text.
- v4.5 shadows: deep blacks → **cards rest flat**; the lift is the cream-on-cream colour step. Only floating surfaces cast a warm-ink shadow.
- Fonts: system-ui body + Georgia serif display → **IBM Plex Sans** body/UI + **Instrument Serif** headings. Georgia survives only as the serif's offline fallback inside the font stack. **Hard floor: Instrument Serif never renders below 18px.**
- Radii: 1rem card → **0.75rem** (2a rhythm: 8px small, 12px large, 99px pills).

**New in 2a — AA text variants** (mandatory for any text under 18px, because the raw brand hexes are tuned as fills): `--brown-text` `#806241` · `--sage-text` `#526F56` · `--negative-text` `#AB4925`.

**What remains locked**: every token NAME, and every structural pick (Card / DataTable / KpiTile / Drawer / Stepper / Timeline / Charts component choices). Two reversals in eleven days have moved values only — that is the system working as designed.

**Source of truth**: `src/index.css` single `:root` block (no `.dark` counterpart) + `src/lib/design/tokens.ts`. Enforcement digest: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md).
