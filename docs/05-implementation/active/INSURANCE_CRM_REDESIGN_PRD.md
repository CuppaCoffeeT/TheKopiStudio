# Insurance CRM Redesign — PRD

**Created**: 2026-07-14 · **Last Updated**: 2026-07-14 · **Status**: 🔵 Planning · **Priority**: High
**Work type**: feature (app-wide restyle + dashboard home + rebrand — no new module, no new tables)

🤖 Build via: `/prd-execute docs/05-implementation/active/INSURANCE_CRM_REDESIGN_PRD.md`
✅ Completion gate: all phase gates green (tsc 0 · build · Gate-3 greps zero in touched folders · @p0 Playwright green · visual verify per phase) → PRD moves to `completed/`

## 📊 Progress / State

Current phase: 0 · Blockers: none

| Phase | Status | Notes |
|---|---|---|
| P1 Token consolidation (navy/gold/serif as system of record) | ⬜ | |
| P2 Layout & primitive restyle pass | ⬜ | depends P1 |
| P3 Dashboard home (`/dashboard` module cards + widgets) | ⬜ | depends P1; parallel with P2 |
| P4 Rebrand user-facing → "Insurance CRM" | ⬜ | parallel-safe (disjoint files) |
| P5 Docs refresh + gates + E2E | ⬜ | depends P1–P4 |

## 📋 Definition

**What**: Refresh the whole app's look (refining the existing navy/gold/serif editorial identity), replace the placeholder module list at `/dashboard` with a card-based dashboard home (module cards + KPI + client-progress widgets), and rename the user-facing app brand to **Insurance CRM**.

**Why**: The layout is still an AppBase-template copy; the 2026-07-07 de-AppBase retheme changed tokens but left stale light-era token blocks, stale design docs, and a placeholder home. The user wants a dashboard-first UX where each login lands on their modules as cards plus a client list showing profile-completion progress.

**Target users**: all roles (super_admin, management, supervisor, advisor, manager — verified live in `public.roles`). Module cards are per-user via `useAuth().modules`.

**Success criteria**:
- Login lands on a real dashboard: greeting, per-user module cards (all 8 DB modules render for a full-access user), KPI tiles, client-progress widget.
- No light-era visual artifacts (zinc/white hovers, light sidebar tokens) anywhere on the navy canvas.
- Browser tab, header wordmark, login page say "Insurance CRM"; `src/main.tsx` hostname guard untouched.
- Gates: `tsc` 0 errors · `npm run build` · Gate-3 five greps return zero in touched feature folders · @p0 suite green (incl. `tests/workflows/crm/dashboard.spec.ts` + `tests/auth.setup.ts`).

**User decisions (2026-07-14, in-conversation)**: aesthetic = **Editorial navy/gold/serif** (refine, don't replace) · **dashboard replaces all nav** · rename **user-facing only**.

## 🔎 Research findings (verified 2026-07-14 — prd-execute does NOT re-research)

### Visual system today
- Navy/gold palette lives in `src/index.css` `:root` (~line 170): `--background: 210 53% 11%` navy, `--foreground: 43 48% 89%` cream, `--primary/--accent/--ring: 43 55% 55%` gold, `--card: 209 44% 13%`, `--destructive: 6 64% 47%`, `--radius: 0.75rem`. `:root` and `.dark` match; `src/lib/design/ThemeProvider.tsx` pins `resolved='dark'` permanently (theme toggle is a no-op).
- Fonts: `--font-sans` = system-ui; `--font-pixel`/`--font-pixel-display`/`--font-prose` are compat aliases → Georgia/Times serif.
- **Stale leftovers in `src/index.css`**: LOCKED_PICKS v1–v3 var blocks (card/kpi/drawer/stepper/timeline/chart/CTA) still hold light-era zinc/red/green hexes and are still consumed by primitives; `--sidebar-*` tokens still light (`0 0% 98%`).
- **All design docs stale** (`docs/01-system-architecture/design-system/` PHILOSOPHY/COLORS/TYPOGRAPHY/TOKENS + siblings): they describe the pre-rebrand AppBase slate/zinc/Geist look.
- `docs/99-refactor/_system/LOCKED_PICKS.md` still locks CTA slate-700 / red-700 accent / zinc `--page-bg` — contradicted by the shipped navy/gold theme. The user's 2026-07-14 aesthetic decision **is** the explicit reversal; P1 must record it there.

### Navigation / landing reality
- `src/App.tsx`: `/` → `/login`; protected children of `DashboardLayout`: `/dashboard` (→ `src/pages/Home.tsx`), `/profiler-results(/:id)`, `/crm`, `/clients(/:id, /:id/report)`, `/crm-reports`, `/account-settings`, `/manage-accounts`; public `/profiler` outside the shell.
- There is **no header nav-link bar**. `AppHeader*` (primitives/shell) carries logo+breadcrumb, ⌘K pills, bell, view-as, theme, user menu. Module nav = `Home.tsx` placeholder card list + `GlobalCommandPalette` (⌘K). "Dashboard replaces all nav" therefore = rewrite `Home.tsx` into the real dashboard; ⌘K stays as a shortcut.
- Post-login redirect hardcodes `/dashboard` in `src/pages/Login.tsx:42`, `src/contexts/AuthContext.tsx:383`, `AppHeaderLogo` link. Keep `/dashboard` as landing (test contract `tests/auth.setup.ts:38-39` waits for `**/dashboard`).
- `Home.tsx` testids `home-module-grid` / `home-module-tile-<path>` are asserted by `tests/workflows/crm/dashboard.spec.ts:314-330` — preserve them in the new dashboard.

### Data reality (live-verified via Supabase MCP, project `mymzcbalyqqgdmzsfmam`)
- RPC `public.get_user_modules(p_user_id)` → TABLE(module_id, name, description, icon_name, path, category, sort_order); role grants UNION per-user overrides. Client shape: `UserModule` in `src/contexts/AuthContext.tsx:22` (`icon_name` is a Lucide name **string** — needs a lookup helper to render).
- `public.modules` (8 active): Dashboard `/dashboard`, Profiler `/profiler`, Results `/profiler-results`, CRM Dashboard `/crm`, Clients `/clients`, Portfolio Report `/crm-reports` (category `general`); Manage Accounts, Account Settings (category `admin`).
- `clients` has **no completeness/status/stage column**. "Completed profile" must be derived: (a) non-null coverage over `CrmClient` fields (`src/features/crm/types.ts:61`), and/or (b) linked profiling run via `results.client_id`. `policies.status` is free text, unverified (0 rows). Most tables are empty — widget can't be validated against real data yet.
- Existing hooks to reuse: `src/features/crm/hooks/useDashboardStats` (→ `CrmDashboardStats { totalClients, activePolicies, totalAnnualPremium, upcomingFollowUps }`, `queryKeys.crmDashboard.stats()`), `useClientsList` (paginated). `useDashboardCounts` does **not** exist in this repo (AppBase-only — don't reference it).

### Precedent / primitives
- Unused-by-Home launcher primitives exist: `src/components/primitives/dashboard/` — `ModuleCard` (name/icon/description/count/urgent/pinned/size/onClick), `ModuleSearch`, `GreetingHeader`, `CategoryHeader`, `AttentionHeader`, `KpiTile`, `CountBadge`, `NumberTicker`, `NeedsAttentionPill`. Compose these; ModuleCard JSDoc points at the session-03 Dashboard composition as the layout precedent.
- List widget: `ui/DataTable`/`DataRow`/`MobileListCard`; progress bar: `Progress` (primitives/form); charts: primitives/charts only.
- Features present: `crm/`, `profiler/`, `account-settings/`, `manage-accounts/`. (CLAUDE.md mentions of `clientprofiles`/`people`/`dashboard` features refer to the old AppBase repo — absent here.)

### Rebrand hit list ("Prospect Profiler")
User-facing (rename): `index.html:7,9` · `src/components/primitives/shell/SEO.tsx:26` (tab-title suffix) · `src/components/primitives/shell/AppHeaderLogo.tsx:19,27` · `src/features/profiler/components/wizard/WizardTopBar.tsx:31` · `src/features/profiler/pages/ProfilerWizardPage.tsx:40`.
Do NOT touch: `src/main.tsx:71-73` hostname guard (`prospect-profiler-app.vercel.app` — deploy infra), `package.json` name, comments/fixtures/migration comments.
Default (Open Question #1): the public `/profiler` wizard keeps "Prospect Profiler" as its **tool** name; only app-brand surfaces become "Insurance CRM".

### Constraints (rule digests — obey per phase)
- Tokens only, never raw hex; `bg-background`/`text-foreground` semantics (`.claude/rules/design-system.md`). All 5 interaction states; hover must contrast with page bg. Visual verify per phase + `Visual verify:` line in commit message.
- Primitives-only imports; Gate-3 five greps must be zero in touched folders (`docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md`). Primitive edits follow the 5-step protocol (add props, never rename — `universal-components-protocols.md`).
- Data: `queryKeys` factory · every `.select()` has `.range()`/`.limit()`/`.single()` · module gating via `useAuth().modules` only · `dvh` not `vh`, 44px targets, 16px inputs (mobile-web.md).
- Token changes ripple: update `src/lib/design/tokens.ts` + LOCKED_PICKS.md + DESIGN_CATALOG_PRIMITIVES.md + design-system.md inline values together.

## 🚦 Phases

### P1 — Token consolidation: navy/gold/serif becomes the system of record
**Goal**: one coherent token layer; no light-era leftovers. **Parallel-safe**: no (everything downstream reads tokens).
- Rewrite stale LOCKED_PICKS v1–v3 var blocks in `src/index.css` (card/kpi/drawer/stepper/timeline/chart/CTA vars) + `--sidebar-*` to navy/gold-consistent values; align `src/lib/design/tokens.ts`.
- Record the aesthetic reversal in `docs/99-refactor/_system/LOCKED_PICKS.md` (new dated entry: navy/gold/serif supersedes slate/red/zinc — user decision 2026-07-14); update `.claude/rules/design-system.md` inline token references (CTA, focus ring, page-bg guidance).
- Decide ThemeProvider: keep pinned-dark; remove/disable the no-op theme toggle in the header user menu (Open Question #2 default: hide toggle).
- **Gate**: build + visual sweep of every route on `npm run dev` — no white/zinc artifacts; screenshot evidence in Execution Log.

### P2 — Layout & primitive restyle pass (editorial polish)
**Goal**: the "nicer layout" ask — spacing, typography hierarchy (serif display, comfortable measure), card rhythm, header polish, mobile-first. **Depends**: P1. **Parallel-safe with P3** (disjoint files if P2 stays out of `Home.tsx`).
- Sweep pages: Login, CRM dashboard, Clients list/detail/report, Results list/detail, Portfolio Report, Account Settings, Manage Accounts, public Profiler wizard — apply editorial layout rules (title once, single hero action bar, no cards-in-cards) using existing primitives; primitive edits via 5-step protocol (props additive only).
- Mobile: verify `dvh`, stacked card rows <640px, touch targets on every touched page.
- **Gate**: Gate-3 greps zero in touched folders · tsc 0 · visual verify per page (dev server, all 5 states on changed interactive elements).

### P3 — Dashboard home: card launcher + widgets
**Goal**: replace `src/pages/Home.tsx` placeholder with the real dashboard. **Depends**: P1.
- Compose `GreetingHeader` + `ModuleSearch` + category sections (`CategoryHeader`: general/admin from `module.category`) of `ModuleCard`s from `useAuth().modules`; build a small `icon_name`→LucideIcon lookup helper. **Preserve testids** `home-module-grid` / `home-module-tile-<path>`.
- KPI row: `KpiTile` × `useDashboardStats` (totalClients, activePolicies, totalAnnualPremium, upcomingFollowUps) — gate render on user having the `/crm` module.
- Client-progress widget: paginated client list (reuse `useClientsList` pattern; `.range()` + count) with per-client derived completeness — % of key `CrmClient` fields filled + "Profiled ✓" badge when a `results.client_id` row exists (one batched query, `.limit()`-compliant; new `queryKeys` entries). Row click → `/clients/:id`. Empty-state via `NoResultsState` (tables are near-empty in prod).
- Landing stays `/dashboard`; ⌘K palette untouched.
- **Gate**: `tests/workflows/crm/dashboard.spec.ts` green unmodified (testids preserved) + new @p0 assertions for KPI row + widget empty state · Gate-3 zero · per-role check: user without `/crm` module sees cards only, no KPI/widget leakage.

### P4 — Rebrand user-facing → "Insurance CRM"
**Goal**: brand rename, user-facing only. **Parallel-safe**: yes (disjoint files).
- Edit exactly: `index.html` title+author · `SEO.tsx` suffix · `AppHeaderLogo.tsx` wordmark+aria-label · Login page brand text if present. `/profiler` wizard surfaces (`WizardTopBar.tsx`, `ProfilerWizardPage.tsx` SEO title) keep "Prospect Profiler" as the tool name per Open Question #1 default.
- Do NOT touch `src/main.tsx` hostname guard, `package.json`, comments, fixtures, migrations, docs (user chose user-facing only).
- **Gate**: `grep -ri "prospect profiler" src/ index.html` returns only the sanctioned hits (main.tsx guard, comments, profiler-tool surfaces); no test asserts the old title (verified: none do).

### P5 — Docs refresh + full gates
**Goal**: docs describe reality; everything green. **Depends**: P1–P4.
- Rewrite `docs/01-system-architecture/design-system/` PHILOSOPHY/COLORS/TYPOGRAPHY/TOKENS (+ audit ARCHETYPES/DARK_MODE/SPACING_MOTION/PRIMITIVES) to the navy/gold/serif system, within TOKEN_BUDGET ceilings; update DESIGN_CATALOG_PRIMITIVES.md rows for restyled primitives.
- Append decisions/lessons per `lessons-logging.md` (aesthetic reversal, derived-completeness approach).
- **Gate**: `/check-docs` clean · full @p0 suite green · `npm run build` · move PRD → `completed/` + flip DOCUMENTATION_INDEX row.

## 🎯 Definition of Done — gates
tsc 0 · `npm run build` · Gate-3 five greps zero in every touched feature folder · @p0 Playwright green (auth.setup `**/dashboard` contract intact) · visual verify evidence per phase · docs registered/updated · LOCKED_PICKS reversal recorded.

## 🔐 Permissions Matrix
No new gated actions or roles. Dashboard renders strictly from `useAuth().modules` (existing RPC); KPI/client widget render is additionally gated on the `/crm` (or `/clients`) module being present. Negative check (P3 gate): a user lacking `/crm` sees module cards only.

## ✅ Resolved Decisions (2026-07-14, execution start — provisional defaults, all reversible)
1. **Wizard naming**: public `/profiler` wizard keeps "Prospect Profiler" as the *tool* name inside the Insurance CRM app. Reverse = 2-file edit (WizardTopBar, ProfilerWizardPage).
2. **Theme toggle**: hide the no-op toggle (ThemeProvider stays pinned dark); no light navy theme built.
3. **Completeness formula**: % non-null over key CrmClient fields + "Profiled" badge from `results.client_id`. Re-weight when real data exists.

## ❓ Open Questions / Risks
1. Naming collision: a separate `~/Documents/Projects/Insurance CRM` folder exists — this PRD renames in-app branding only; never touch that folder.
2. Prod tables nearly empty — widget verified via seeded/test data and empty states, not production data.
3. E2E role coverage: `.env.secrets` lacks passwords for advisor/manager/super_admin (global-setup warning) — per-role negatives limited to configured roles; caveat recorded if unpassable.

## 🗒️ Execution Log
| Date | Phase | Result |
|---|---|---|
| 2026-07-14 | — | PRD authored (research workflow: 5 readers, live DB verified) |
