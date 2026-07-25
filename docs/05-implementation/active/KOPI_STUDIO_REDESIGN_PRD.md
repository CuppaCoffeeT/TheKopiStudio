# The Kopi Studio Redesign — Direction 2a "Kopi House" — PRD

**Created:** 2026-07-25 · **Last Updated:** 2026-07-25 · **Status:** 🔵 Planning · **Priority:** 🔴 Critical (whole-app visual + structural rebuild)
**Work type**: refactor (palette inversion + shell restructure across every route; new primitives, no new tables, no new routes)

🤖 Build via: `/prd-execute docs/05-implementation/active/KOPI_STUDIO_REDESIGN_PRD.md`
✅ Completion gate: the **Definition of Done** gates below green → PRD moves to `completed/`

## 📊 Progress / State

| Phase | Status | Notes |
|---|---|---|
| P1 — Brand token layer: navy/gold dark → Kopi cream/brown light | ⬜ | Serialize first; everything depends on it |
| P2 — AppSidebar + DashboardLayout mount | ⬜ | Depends on P1 |
| P3 — Frames drop the top masthead | ⬜ | Depends on P2 |
| P4 — Dashboard home → 2a Overview (launcher removed) | ⬜ | Parallel-safe after P3 |
| P5 — List archetype → 2a | ⬜ | Parallel-safe after P3 |
| P6 — Detail archetype → 2a dossier | ⬜ | Parallel-safe after P3 |
| P7 — Uncovered screens + profiler wizard restyle | ⬜ | Parallel-safe after P3 |
| P8 — Rebrand user-facing → "The Kopi Studio" | ⬜ | Parallel-safe after P1 (disjoint: 4 files) |
| P9 — E2E repair, docs refresh, full gates | ⬜ | Last; depends on all |

Current phase: 0 · Blockers: none

## 📋 Definition

**What**: Rebuild every surface of the app onto The Kopi Studio brand — a **light** warm-cream/coffee-brown palette with Instrument Serif headings and IBM Plex Sans body — in the structural language of **direction 2a "Kopi House"**: a 200px sidebar, dateline greeting masthead, index-numeral KPI cards, and hairline tables that carry layout without boxes.

**Why**: The app currently ships the AppBase template's structure wearing direction 1a's navy/gold paint. The 1a work applied a style spec across 33 existing files and created zero new components, so the shell, dashboard, list and detail archetypes never changed. Meanwhile the brand moved: the repo is `CuppaCoffeeT/TheKopiStudio` and the product is The Kopi Studio, but every user-facing surface still reads "Insurance CRM" on navy. This PRD closes both gaps in one pass.

**Target user/role**: advisor (owns their book), manager (sees everything), super_admin (everything). No RBAC change — the sidebar renders from existing module grants.

**Success criteria**: every route renders on the Kopi palette with zero navy/gold hexes left in `src/`; the sidebar is the primary nav on all 8 authed routes; dashboard/list/detail match their 2a comps; all 14 `@p0` specs green; the 5 pre-push gates pass; every text/background pairing clears WCAG AA.

**Scope cut (NOT in v1)**:
- No dark mode. The brand card is light-only; the app currently pins dark. This swaps one pinned theme for another — it does not build a toggle.
- No directions 2b/2c elements (activity rail, gradient hero band, categorical sage viz).
- No data model, RLS, route, or module-grant changes.
- No new modules; "+ 3 modules soon" in the comp is a static affordance, not a feature.
- No mobile redesign beyond keeping the existing responsive behaviour working — 2a's comps are desktop-only (see Open Questions).

## 🔎 Research findings (verified 2026-07-25 — prd-execute inherits, does NOT re-research)

**Design source**: Claude Design project `c59d3b3e-810d-4963-a671-ba7907f629c5` ("Editorial direction exploration"), file `Kopi Studio Directions.dc.html`, turn 2, option **2a**. Read via the DesignSync MCP. The project also carries `uploads/kopi studio brand card.html` — a developer-ready brand spec with the exact CSS variable block, button/form/nav tables, and spacing scale. **The brand card is the token authority; the 2a comp is the layout authority.** Both are staged into the repo by P1.

**The palette is an inversion, not a repaint.** Today: page `#0d1b2a` navy, card `#12202f`, cream text `#f0ead6`, gold `#c9a84c`. Target: page `#f0e6d6`, card `#faf6ee`, raised `#ffffff`, brown `#8b6a47` primary, sage `#5a7a5e` secondary/positive, terracotta `#d97551` negative, text `#3a2e24`, muted `#7d6b5b`, border `#d9ccc0`.

**Token abstraction is good — this is why the inversion is tractable.** `src/index.css` holds 204 `--` vars under `:root`; 118 primitive components consume them via `var(--…)`. Only **5 files** hardcode palette hexes anywhere in `src/`:
`src/index.css` · `src/lib/design/tokens.ts` · `src/features/profiler/lib/print.css` · `src/components/primitives/charts/ChartShell.tsx` · `src/components/primitives/overlays/Modal.tsx`.
Everything else inherits the palette for free.

**Theme pinning**: `src/lib/design/ThemeProvider.tsx:76` hard-pins `const resolved: ResolvedTheme = 'dark'`. `:root` is the always-dark source of truth (the `.dark` override block was deleted during the 1a work). P1 flips this to `'light'` and rewrites `:root`. The `ThemePreference` type and localStorage key stay — no toggle is wired either way.

**Typography today**: `--font-pixel` / `--font-pixel-display` / `--font-prose` = `Georgia, "Times New Roman", serif`; `--font-sans` / `--font-subheader` = `system-ui` stack; `--font-mono` = `ui-monospace`. Target: Instrument Serif (headings, **never under 18px** per the brand card) and IBM Plex Sans 400/500/600/700 (body/UI). This is a token-level swap at `index.css:89–98` plus font loading.

**Shell blast radius is 4 files, not 9 pages.** All 8 authed routes get chrome from three frames, each of which renders `AppHeader` internally:
| Frame | Pages |
|---|---|
| `primitives/shell/AppHeaderShell.tsx` | AccountSettingsPage · PortfolioReportPage · CrmDashboardPage |
| `primitives/ui/ListPageFrame.tsx` | ClientsListPage · ManageAccountsPage · ResultsListPage |
| `primitives/detail/DetailPageFrame.tsx` | ClientDetailPage · ResultDetailPage |
`components/shared/app-shell/DashboardLayout.tsx` wraps them all and is currently chrome-free (⌘K palette + one Suspense boundary) — its own JSDoc names it the place to "add app-wide chrome (header, sidebar…)". That is where the sidebar mounts.

**Routes** (`src/App.tsx`): `/login` · `/profiler` (public, outside `DashboardLayout`) · `/dashboard` · `/profiler-results` (+`/:id`) · `/crm` · `/clients` (+`/:id`, +`/:id/report`) · `/crm-reports` · `/account-settings` · `/manage-accounts`. `DashboardHomePage` uses no frame — it is a bare launcher today.

**Print contract (do not break)**: `ClientReportPage` is deliberately **not** a `DetailPageFrame`. Per its header comment it is a dedicated report canvas locked to white/dark-ink on screen *and* print via `lib/report-print.css`; `.report-print-root` scopes printing and the action bar is `.no-print`. Ironically the light palette now *agrees* with this page — but the sidebar must be excluded from it and from print.

**Accessibility — three real failures in the brand palette as given** (computed against WCAG 2.1):

| Foreground | on card `#faf6ee` | on page `#f0e6d6` | Verdict |
|---|---|---|---|
| text `#3a2e24` | 12.21:1 | 10.65:1 | ✅ |
| muted `#7d6b5b` | 4.72:1 | 4.12:1 | ⚠️ fails AA body on the page bg |
| brown `#8b6a47` | 4.58:1 | 4.00:1 | ⚠️ fails AA body on the page bg |
| sage `#5a7a5e` | 4.45:1 | 3.88:1 | ❌ fails AA body on both |
| terracotta `#d97551` | 2.95:1 | 2.57:1 | ❌ fails badly — and it is the error colour |
| cream `#faf6ee` on brown `#8b6a47` | 4.58:1 | — | ✅ primary button passes |

Resolution (P1): keep every brand hex for **fills, borders, icons and ≥18px display type**, and add three AA-safe *text* variants used only for small text. Derived by darkening lightness until both grounds clear 4.5:1, so brand character is preserved:
`--brown-text: #806241` (4.54 page / 5.21 card) · `--sage-text: #526f56` (4.51 / 5.17) · `--negative-text: #ab4925` (4.58 / 5.25).

**Test surface**: 14 `.spec.ts` files, all carrying `@p0`, across `tests/workflows/{crm,profiler,reports}`. Auth is `storageState`-per-role from `tests/auth.setup.ts`. Specs asserting on chrome, colour, or launcher-grid copy will need repair in P9.

**Hooks trap (carried from `tests/lessons.md`)**: `core.hooksPath=.husky/_` but `.husky/_` is untracked, so in a fresh `git worktree` **no hook runs and every pre-push gate is silently skipped**. A green push from a worktree proves nothing — run the gates explicitly.

## 🛡️ SAFE PATTERN (per-file decision rule)

For any file the rebuild touches, in order:

1. **Does it hardcode a palette hex?** → repoint to a `var(--…)`. Never introduce a new literal. Only the 5 known files should ever need this.
2. **Does it render chrome (header/nav/breadcrumb)?** → change the **frame**, never the page. If a page renders `AppHeader` directly, migrate it onto its frame instead of hand-editing it.
3. **Is it a primitive consuming `var(--…)`?** → leave it alone. It inherits P1 for free. Touch it only if the 2a comp changes its *structure*.
4. **Does it gate on a role string?** → stop; that violates Hard Rule 2. Nav and visibility read `useAuth().modules`.
5. **Otherwise** → out of scope for this PRD.

## 🚧 Hard invariants (must NOT regress)

- All 14 `@p0` specs green at the end of P9.
- The 5 pre-push gates pass: `tsc --noEmit` 0 errors · ESLint · dependency-cruiser · `vite build` · LOC ratchet. **Run them explicitly** — worktree hooks do not fire.
- No role-string checks anywhere; sidebar nav derives from `useAuth().modules` (Hard Rule 2, `.claude/rules/module-access.md`).
- Every `.select()` keeps `.range()` / `.limit()` / `.single()` (Hard Rule 4).
- `timezoneUtils` only, never raw date-fns (Hard Rule 5). The dateline greeting is true-SGT — reuse the existing helper, do not re-derive.
- `showSuccess` / `showError` only (Hard Rule 6).
- `/profiler` stays anonymous-accessible and outside `DashboardLayout`.
- `/clients/:id/report` keeps its print contract: no sidebar, `.report-print-root` scoping intact, `window.print()` output unchanged in structure.
- Zero navy/gold hexes left in `src/` when P1 closes (grep gate).
- No text/background pairing below WCAG AA 4.5:1 for body copy.

## 🚦 Phases

### P1 — Brand token layer: navy/gold dark → Kopi cream/brown light  ·  *serialize*

**Goal**: one commit after which every existing screen renders on cream/brown with no structural change.

- Stage the handoff into the repo: `docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/` — the `.dc.html`, the brand card, and a `decisions.md` recording the 2a pick (mirrors the 2026-07-21 folder shape).
- Rewrite `:root` in `src/index.css` per the brand card variable block; audit all 204 vars, repoint every palette-bearing one. Add the three AA-safe text variants.
- Add Instrument Serif + IBM Plex Sans; repoint `--font-pixel`/`--font-pixel-display`/`--font-prose` → Instrument Serif, `--font-sans`/`--font-subheader` → IBM Plex Sans. Enforce the ≥18px serif floor.
- `ThemeProvider.tsx:76` `resolved` → `'light'`; update the navy comment block.
- Repoint the 4 remaining hardcoded-hex files: `tokens.ts`, `print.css`, `ChartShell.tsx`, `Modal.tsx`.
- Chart language → single brown ramp (2a: "viz stays quiet"); retire the gold/dim-cream series pair.

**Deliverables**: handoff staged · `:root` rewritten · fonts loaded · theme flipped · 5 hex files clean · brown-ramp charts.
**Verify**: `grep -riE '#0d1b2a|#12202f|#c9a84c|#f0ead6' src` returns nothing · tsc 0 · build · every route screenshots on cream.

### P2 — AppSidebar + DashboardLayout mount  ·  *depends on P1*

**Goal**: the 2a sidebar becomes the app's primary navigation.

- New `src/components/primitives/shell/AppSidebar.tsx`: 200px, page-bg ground, wordmark **The Kopi *Studio*** (Instrument Serif, brown italic second word) linking `/dashboard`; nav items 13px IBM Plex Sans; **active** = 2px brown left border + card bg + dark text; **idle** = muted → brown on hover; static "+ N modules soon" affordance.
- Nav items derive from `useAuth().modules` — never role strings.
- Mount in `DashboardLayout.tsx` with the content offset; keep the ⌘K palette mounted (it remains the module-jump affordance now the launcher is gone).
- Responsive: below 1024px collapse to the existing mobile bar. Sidebar is `.no-print`.
- All five interactive states; focus is a visible brown ring; 44px touch targets (`.claude/rules/mobile-web.md`).

**Deliverables**: `AppSidebar.tsx` + `DashboardLayout` mount + responsive collapse + print exclusion.
**Verify**: keyboard-reachable, focus ring visible, active state tracks the route, print preview shows no sidebar.

### P3 — Frames drop the top masthead  ·  *depends on P2*

**Goal**: remove the horizontal `AppHeader` bar now the sidebar carries identity and nav; all 8 pages inherit.

- `AppHeaderShell` · `ListPageFrame` · `DetailPageFrame` stop rendering the full `AppHeader` bar.
- Retain, in a slim strip: breadcrumb (2a detail shows plain text — `Clients / Marcus Tan`), user menu, notifications, ViewAs. Impersonation banner behaviour unchanged.
- Keep every frame's public prop API backward-compatible — grep consumers before any signature change.

**Deliverables**: 3 frames updated; 8 pages visually re-chromed with no per-page edits.
**Verify**: each of the 8 routes renders once, with no doubled chrome and no orphaned spacing.

### P4 — Dashboard home → 2a Overview  ·  *parallel-safe after P3*

**Goal**: `/dashboard` becomes the comp's Overview. **The module-launcher grid is removed** (user decision, 2026-07-25).

- Delete the launcher grid + `ModuleSearch` from `DashboardHomePage`; ⌘K covers module jump.
- Build, top to bottom: uppercase dateline kicker carrying one live stat → Instrument Serif greeting (true-SGT, reuse existing helper) → hairline → **two** index-numeral KPI cards → "Latest additions" serif section head + brown `+ New client` CTA → hairline table (NAME · MODULE · RISK · ADDED · STATUS) with status pills.
- New `primitives/dashboard/KpiIndexCard.tsx`: uppercase label, brown index numeral top-right (`01`), Instrument Serif value + unit, meta line. `KpiTile` stays for other consumers.
- Status pills: sage complete · brown in-progress · terracotta error, all using the AA-safe *text* variants.
- Keep the existing empty-state copy — the book is empty until the CRM import lands.

**Deliverables**: rebuilt `DashboardHomePage` · `KpiIndexCard` · launcher + `ModuleSearch` removed (check `knip` for newly-dead exports).
**Verify**: matches the 2a dashboard comp; empty state still renders; ⌘K still routes.

### P5 — List archetype → 2a  ·  *parallel-safe after P3*

**Goal**: `ListPageFrame` speaks 2a, so all three list pages change at once.

- Title row: uppercase kicker (`CLIENTS · CRM`) → Instrument Serif title + muted inline count → search input and brown CTA right-aligned **on the title row**.
- Table: hairline rows, **no card wrapper**; numerics right-aligned with `tabular-nums`; sage "Generated" / muted "Pending" / terracotta "Overdue · 12 Jul".
- Empty state: Instrument Serif italic line + **one** quiet outline action, no illustration.
- Pagination retained (Hard Rule 4) — restyled, not removed.

**Deliverables**: `ListPageFrame` updated; ClientsListPage · ResultsListPage · ManageAccountsPage inherit.
**Verify**: all three match the comp; pagination and `useURLPagination` behaviour unchanged.

### P6 — Detail archetype → 2a dossier  ·  *parallel-safe after P3*

**Goal**: `DetailPageFrame` speaks 2a.

- Text breadcrumb → Instrument Serif H1 → muted meta line (`Software engineer · Client since Feb 2024 · Moderate risk`) → hairline → ghost `Edit` + brown `Generate report` right-aligned.
- Two-column cream cards on the page ground: left = FINANCIAL POSITION (stat columns + single-brown-ramp stacked bar + legend) and NOTES; right = RELATIONSHIP (label/value rows, values right-aligned).
- Loading state: thin brown progress bar + Instrument Serif italic verb ("Generating report…").

**Deliverables**: `DetailPageFrame` updated; ClientDetailPage · ResultDetailPage inherit.
**Verify**: matches the comp; tabs/side-rail props still honoured; loading state renders.

### P7 — Uncovered screens + profiler wizard  ·  *parallel-safe after P3*

**Goal**: the screens 2a never mocked, resolved from its language rather than invented.

- **Login**: cream ground, new wordmark, brown primary. (Comps show no login.)
- **Account Settings** · **Portfolio Report**: derive from 2a — kicker + serif title + hairline sections + cream cards. Record each deviation in the handoff `decisions.md`.
- **Profiler wizard** (`/profiler`, stays public and outside the shell): restyle only — Instrument Serif scale, cream ground, brown CTA. **Remove the 🎯 emoji** at `IntakeForm.tsx:35`; it is the only saturated off-palette mark in the app.
- **Client report** (`/clients/:id/report`): align to the brand card's report palette — this is the one place the *extended* palette (grey `#e8e6e0`, green box `#d9e8e0`) is permitted. Print contract preserved.

**Deliverables**: 5 screens restyled + deviations recorded.
**Verify**: `/profiler` still loads anonymously; report still prints clean.

### P8 — Rebrand user-facing → "The Kopi Studio"  ·  *parallel-safe after P1*

- `primitives/shell/SEO.tsx:26` browser title · `primitives/shell/AppHeaderLogo.tsx` wordmark (now rendered by `AppSidebar`) · `pages/Login.tsx:49` sign-in title · `index.html` title/meta.
- Wordmark treatment: Instrument Serif, brown italic second word — **The Kopi *Studio***.
- Internal package name stays `prospect-profiler`; this is a user-facing rename only.

**Deliverables**: 4 files; zero "Insurance CRM" strings in user-facing copy.
**Verify**: `grep -rn "Insurance CRM" src` returns only the `finance.ts` provenance comment.

### P9 — E2E repair, docs refresh, full gates  ·  *depends on all*

- Repair the 14 `@p0` specs against the new chrome/copy — especially any asserting on the launcher grid, `ModuleSearch`, or navy tokens.
- Refresh `docs/01-system-architecture/DESIGN_SYSTEM.md` + `design-system/{COLORS,TYPOGRAPHY,TOKENS,DARK_MODE}.md` to the Kopi palette. `DARK_MODE.md` needs an explicit "the app is light-pinned" note or retirement.
- Append `decisions.md` / `lessons.md` entries per `.claude/rules/lessons-logging.md`.
- Register this PRD's completion; move `active/` → `completed/`.
- Run all 5 gates explicitly plus the full Playwright suite.

## 🎯 Definition of Done — gates

| Gate | Check |
|---|---|
| Types | `tsc --noEmit` → 0 errors |
| Lint | ESLint clean |
| Architecture | dependency-cruiser clean, no net-new violations |
| Build | `vite build` succeeds |
| LOC ratchet | within baseline |
| Dead code | `knip` no worse than baseline (launcher removal should *improve* it) |
| E2E | all 14 `@p0` specs green, all three roles |
| Palette | zero navy/gold hexes in `src/`; zero hardcoded hexes outside the 5 known files |
| A11y | every body-text pairing ≥ 4.5:1; focus ring visible on every interactive element; 44px touch targets |
| Print | `/clients/:id/report` prints with no sidebar and unchanged structure |

## ❓ Open Questions / Risks

| # | Item | Provisional default (reversible) |
|---|---|---|
| 1 | **Mobile is undefined.** Every 2a comp is 1180px desktop. | Sidebar collapses to the existing mobile bar below 1024px. Revisit if it feels wrong on a phone. |
| 2 | **Brand palette fails AA in three places** (sage, terracotta, and everything on the page bg). | Ship the three darkened *text* variants; brand hexes keep fills/borders/large type. Flagged for brand sign-off — the alternative is amending the brand card. |
| 3 | **Font delivery.** Brand card says "load from Google Fonts"; that is a third-party request on every page load. | Follow the brand card (CDN) in P1. Self-hosting via `@fontsource` is a drop-in swap later if you want it. |
| 4 | **Instrument Serif ≥18px floor** vs. existing small serif usages. | Audit during P1; anything under 18px moves to IBM Plex Sans. |
| 5 | **"+ 3 modules soon"** in the comp implies a roadmap the app does not have. | Render it as a static muted affordance; drop it if you would rather not promise. |
| 6 | **Launcher removal is one-way** for users who navigate by the grid. | Decided 2026-07-25: remove. ⌘K + sidebar replace it. |
| 7 | Dark mode is dropped entirely. | The brand is light-only. `ThemePreference` type/storage stay so a future toggle is cheap. |

## 🗒️ Execution Log

| Date | Phase | Notes |
|---|---|---|
| 2026-07-25 | — | PRD authored. Direction 2a picked from the Claude Design turn-2 exploration; brand card adopted as token authority; launcher-removal and rebrand confirmed by user. |

## 📚 Related Documentation

- [1A_MASTHEAD_SPEC.md](../design-handoffs/2026-07-21-visual-directions/1A_MASTHEAD_SPEC.md) — the superseded navy/gold direction
- [INSURANCE_CRM_REDESIGN_PRD.md](../completed/INSURANCE_CRM_REDESIGN_PRD.md) — the 2026-07-14 pass this one replaces
- [DESIGN_SYSTEM.md](../../01-system-architecture/DESIGN_SYSTEM.md) · [design-system/](../../01-system-architecture/design-system/)
- Rules: [module-access](../../../.claude/rules/module-access.md) · [mobile-web](../../../.claude/rules/mobile-web.md) · [ui-components](../../../.claude/rules/ui-components.md) · [timezone](../../../.claude/rules/timezone.md)
