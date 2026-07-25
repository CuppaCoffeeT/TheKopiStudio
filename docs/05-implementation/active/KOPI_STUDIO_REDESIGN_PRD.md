# The Kopi Studio Redesign — Direction 2a "Kopi House" — PRD

**Created:** 2026-07-25 · **Last Updated:** 2026-07-25 · **Status:** 🟡 In Progress (P1) · **Priority:** 🔴 Critical (whole-app visual + structural rebuild)
**Work type**: refactor (palette inversion + shell restructure across every route; new primitives, no new tables, no new routes)

🤖 Build via: `/prd-execute docs/05-implementation/active/KOPI_STUDIO_REDESIGN_PRD.md`
✅ Completion gate: the **Definition of Done** gates below green → PRD moves to `completed/`

## 📊 Progress / State

| Phase | Status | Notes |
|---|---|---|
| P1 — Brand token layer: navy/gold dark → Kopi cream/brown light | ✅ | 103 files repainted over 4 adversarial rounds (158→76→23→1). All 5 gates green |
| P2 — AppSidebar + DashboardLayout mount | ✅ | 200px rail, nav from `useAuth().modules` (shared with ⌘K), data-driven "modules soon", card-cream ground for AA |
| P3 — Frames drop the top masthead | ✅ | Bar deleted; identity/bell/ViewAs re-homed to sidebar footer; breadcrumb inline per comp |
| P4 — Dashboard home → 2a Overview (launcher removed) | ✅ | Launcher + ModuleSearch deleted; KpiIndexCard; hairline feed; loading/error states restored |
| P5 — List archetype → 2a | ✅ | Kicker + serif title + inline count; search/CTA on title row; card wrapper removed |
| P6 — Detail archetype → 2a dossier | ✅ | Two-column cream dossier; single brown ramp; serif-italic loading verb |
| P7 — Uncovered screens + profiler wizard restyle | ✅ | Login/settings/portfolio derived + logged; wizard de-emojied; report keeps print contract |
| P8 — Rebrand user-facing → "The Kopi Studio" | 🟨 | Parallel-safe after P1 (disjoint: 7 files). `PRODUCT_NAME` + SEO/ErrorState/NotFound/RouteError done; AppHeaderLogo · Login · index.html remain |
| P9 — E2E repair, docs refresh, full gates | ⬜ | Last; depends on all |

Current phase: P8 · Blockers: none

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

**Token abstraction is good** — `src/index.css` holds 204 `--` vars under `:root` and 118 primitive components consume them via `var(--…)`, so most of the tree repaints for free.

> ⚠️ **CORRECTED 2026-07-25 during P1.** The original claim here — "only 5 files hardcode palette hexes" — was **wrong**, and the error was one of grep scope, not of fact. Searching for the navy/gold *hex literals* found 5 files. The real migration surface was **103 files / 158 findings**, because dark-era colour also hides as:
> - `rgb()` / `rgba()` triples of the same colours (`rgba(24,38,56,.92)` is `#182638`; `rgba(201,168,76,.14)` is the old gold)
> - Tailwind **space-separated arbitrary syntax** — `bg-[rgb(201_168_76_/_0.14)]` — which no hex or `rgb(r,g,b)` grep will ever match
> - dark-era Tailwind utilities: `bg-red-950/30`, `text-red-400`, `zinc-*`, `slate-*`, and cool-grey literals `#ececee` / `#e4e4e7` / `#18181b`
> - inline `fontFamily: 'Georgia, serif'` in components rather than in the token layer
> - `dark:` variants, now dead on a light-pinned app
>
> **Lesson for any future palette work: grep the rendered colour space, not the literal.** Four adversarial rounds were needed to reach dry (158 → 76 → 23 → 1).

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

- Product name is one exported constant: `src/lib/product.ts` → `PRODUCT_NAME`. Every surface that prints it to a user reads that constant; no hand-typed brand strings.
- Consumers: `primitives/shell/SEO.tsx` browser title · `primitives/shell/ErrorState.tsx` + `pages/NotFound.tsx` + `pages/RouteError.tsx` error footers · `primitives/shell/AppHeaderLogo.tsx` wordmark (now rendered by `AppSidebar`) · `pages/Login.tsx:49` sign-in title · `index.html` title/meta.
- Wordmark treatment: Instrument Serif, brown italic second word — **The Kopi *Studio***.
- Internal package name stays `prospect-profiler`; this is a user-facing rename only.

**Scope correction (2026-07-25)**: originally written as 4 files, but the error footers in `ErrorState` / `NotFound` / `RouteError` also printed "Insurance CRM", so the completion grep below could never pass at 4. Widened to 7. The constant plus its `SEO` / `ErrorState` / `NotFound` / `RouteError` consumers landed early with the states fix batch; `AppHeaderLogo`, `Login.tsx` and `index.html` remain.

**Deliverables**: 7 files + `src/lib/product.ts`; zero "Insurance CRM" strings in user-facing copy.
**Verify**: `grep -rn "Insurance CRM" src` returns only provenance references — the `finance.ts` header comment, the `finance-golden-vectors.json` capture note, the `AppHeaderLogo.tsx` history comment and the `features/crm/CONTEXT.md` module description. Zero hits in rendered copy.

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

## ✅ Resolved Decisions (2026-07-25, execution start — all reversible)

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Mobile is undefined (all 2a comps are 1180px desktop) | Sidebar collapses to the existing mobile bar below 1024px | Reuses shipped responsive chrome; no new mobile design invented where the comp is silent |
| 2 | Brand palette fails WCAG AA in three places | Ship `--brown-text #806241` · `--sage-text #526f56` · `--negative-text #ab4925` for small text; brand hexes keep every fill, border, icon and ≥18px display type | Never ship illegible error text; never unilaterally repaint a brand. **Surfaced for brand sign-off in the final report** — amending the brand card instead is a one-line revert |
| 3 | Font delivery: Google Fonts CDN vs self-host | CDN `<link>` per the brand card | `@fontsource` means an npm install, which is forbidden mid-run (shared `node_modules`). Self-hosting is a drop-in swap in a later pass |
| 4 | Instrument Serif ≥18px floor vs existing small serif usages | P1 audits every serif usage; anything under 18px moves to IBM Plex Sans | The brand card states the floor as a rule, not a preference |
| 5 | "+ 3 modules soon" implies a roadmap that does not exist | Render **data-driven**: count modules the signed-in user lacks; omit the line entirely when that count is zero | Honest in every state, and still matches the comp when it is true |
| 6 | Launcher removal is one-way for grid navigators | Remove it; sidebar + ⌘K replace it | User decision, 2026-07-25 |
| 7 | Dark mode dropped entirely | Light-pinned. `ThemePreference` type + localStorage key stay | Brand is light-only; keeping the type makes a future toggle cheap |

## ❓ Residual risks

- **Brand-card AA deviation (#2)** is the one place this build knowingly departs from the supplied brand spec. Needs your sign-off.
- **Prod DB is shared** across worktrees. This PRD writes no schema, so the risk is nil for this run.
- **Worktree hooks do not fire** (`.husky/_` untracked) — every gate must be run explicitly, never inferred from a green push.

## 🗒️ Execution Log

| Date | Phase | Notes |
|---|---|---|
| 2026-07-25 | — | PRD authored. Direction 2a picked from the Claude Design turn-2 exploration; brand card adopted as token authority; launcher-removal and rebrand confirmed by user. |
| 2026-07-25 | P1 | ✅ Token layer inverted to Kopi cream/brown light. Handoff + `KOPI_2A_SPEC.md` staged; `:root` rewritten; Instrument Serif + IBM Plex Sans loaded; `ThemeProvider` pinned `'light'`. **103 files** repainted across 4 adversarial rounds (158→76→23→1 findings), 33 agents. Notable catches: a `paths:`-scoped `.claude/rules/dark-mode.md` that auto-loaded into every agent and declared the app permanently navy/gold (replaced by `light-theme.md`, history preserved); a surviving navy panel in `ChartTooltip` painting dark ink on dark; gold hidden as `bg-[rgb(201_168_76_/_0.14)]`; the ⌘K palette left with no visible keyboard-selection indicator (1.045:1); the impersonation banner's account email at 3.24:1; and a cream wash on the report hero that *lightened* the ground on the client-facing PDF (3.42:1). Four files trimmed to clear the LOC ratchet (comment inflation only). Gates: tsc 0 · lint 0 err · drift 0 · build ✓ · LOC 37≤38. Visual smoke: 9/9 routes render on cream, 0 console errors. |
| 2026-07-25 | P2 | ✅ `AppSidebar` built + mounted in `DashboardLayout`. Nav derives from `useAuth().modules` via the same `groupModulesByCategory` pair `GlobalCommandPalette` uses, so the rail and ⌘K cannot drift; zero role strings. "+ N modules soon" is data-driven (active modules minus granted; renders nothing at zero) — verified advisor→1, manager/super_admin→hidden. Deviation accepted: rail ships **card** cream not page cream — the comp's own sidebar div is `#faf6ee`, and idle `--fg-muted` labels measure 4.12:1 on page cream (fails AA) vs 4.72:1 on card cream. Responsive `hidden lg:flex` with the existing mobile bar below 1024px; `print:hidden` + `.no-print` preserve the report contract. Gates: tsc 0 · lint 0 err · drift 0 · build ✓ · LOC 37≤38. |
| 2026-07-25 | P3 | ✅ Horizontal masthead retired — the rail is the whole desktop chrome. `AppHeader` + `AppHeaderDesktopBar` deleted (newly dead); `useDashboardChrome` now returns prop bags, not JSX. New `AppSidebarFooter` re-homes the existing `AppHeaderUserMenu` / `NotificationsBell` / `ViewAsSelector` (re-homed, not rebuilt). Breadcrumb became content per the Detail comp; all breadcrumb prop APIs unchanged, so zero page edits were needed. **Two pre-existing bugs found and fixed:** the mobile bar was `md:hidden` against the rail's `lg:flex`, leaving 768–1023px with neither nav; and its search button dispatched `open-global-search`, an event with zero listeners repo-wide — repointed to `open-command-palette`, the only touch route to module nav below `lg`. Wordmark unified (mobile bar still said "Insurance CRM"). knip improved 311→309 unused exports. Gates: tsc 0 · lint 0 err · drift 0 · build ✓ · LOC 36≤38. |
| 2026-07-25 | P4–P7 | ✅ Archetypes rebuilt in 2a language — 5 build agents + 2 adversarial reviewers, then a 4-agent fix round clearing 14 findings. Dashboard: launcher grid + `ModuleSearch` deleted, new `KpiIndexCard` with brown index numerals, hairline "Latest additions" feed. List: kicker + serif title + inline count, search/CTA on the title row, card wrapper removed. Detail: two-column cream dossier, single brown ramp, serif-italic loading verb. Uncovered screens (login/settings/portfolio) derived from 2a and logged as deviations. **Regression caught and reverted:** the dashboard rebuild dropped the KPI loading/error states — a failed query rendered identically to a pending one, re-breaking a bug the 2026-07-14 critic pass had already fixed. **PRD correction:** the claim that 🎯 was "the only saturated off-palette mark" was false — the profiler *result* screens carried four more emoji plus DISC hex tints. Ruling: all emoji removed flow-wide; DISC quadrant hues KEPT as a documented exception because they encode the profiler's data output, softened to pass AA on cream. Five docs advertising the deleted launcher primitives as live were marked retired. Gates: tsc 0 · lint 0 err · drift 0 · build ✓ · LOC pass. 9/9 routes render, 0 console errors. |

## 📚 Related Documentation

- [1A_MASTHEAD_SPEC.md](../design-handoffs/2026-07-21-visual-directions/1A_MASTHEAD_SPEC.md) — the superseded navy/gold direction
- [INSURANCE_CRM_REDESIGN_PRD.md](../completed/INSURANCE_CRM_REDESIGN_PRD.md) — the 2026-07-14 pass this one replaces
- [DESIGN_SYSTEM.md](../../01-system-architecture/DESIGN_SYSTEM.md) · [design-system/](../../01-system-architecture/design-system/)
- Rules: [module-access](../../../.claude/rules/module-access.md) · [mobile-web](../../../.claude/rules/mobile-web.md) · [ui-components](../../../.claude/rules/ui-components.md) · [timezone](../../../.claude/rules/timezone.md)
