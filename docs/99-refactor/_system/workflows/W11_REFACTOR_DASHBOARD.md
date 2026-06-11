# W11 — Refactor dashboard page

**Goal**: Render the refactor system (DAG · backlog · decisions · per-card drill-down · compare · proposals) at `/refactor-dashboard` so planning state is glanceable in-app. Super-admin only. Localhost-first (Vite HMR picks up markdown edits instantly).
**Tier**: Now · **Status**: 🟢 PHASE 1 DONE 2026-04-18 (user approved "for now it's completed"). Phase 2–4 split into separate cards W11.02/.03/.04 deferred behind W02 / W07+W17 / W08 respectively. · **Automation**: 🤖 auto
**Blocked by**: ~~X9~~ (✅) · **Blocks**: nothing — unblocks visibility for the whole refactor

## Why this exists

Markdown is canonical (tenet 8: source over output). The page is a view — read-only. Two-way editing tempts drift; forbid it. Edit markdown, page updates on next deploy.

## Scope

**In:**
- Vite build-time loader (`?raw` import) for `SYSTEM_STATE.md` + `SYSTEM_OVERVIEW.md`
- Parse via `remark` + `remark-gfm` (GitHub table support)
- `/refactor-status` route — renders backlog table, X-decisions, dependency graph (as pre/code for now)
- Each W## row links to its card on GitHub
- Auto-refresh in dev on markdown change

**Out:**
- Editing from the page (read-only — enforce in code)
- Runtime fetch (keeps it simple; no extra endpoint, no staleness)

## Dependencies on other cards

- None technical
- Reads markdown authored by the system itself

## Open workflow questions

- **Q-W11-a** Build-time static or runtime fetch? `[default: build-time via Vite ?raw — simplest, no endpoint]`
- **Q-W11-b** Access control? `[default: you only initially via module-based gate; open to staff if useful]`

## Done-when

- `/refactor-dashboard` renders backlog from live markdown ✅
- Edit to markdown → Vite HMR → page updates (no redeploy, no runtime fetch) ✅
- Access gated to super_admin only via `role_modules` ✅
- User completes visual review (pending)

## Phases

**Phase 1 — MVP (shipped 2026-04-18)** ✅
- Module registered via MCP migration `add_refactor_dashboard_module_super_admin_only`
- Route `/refactor-dashboard` in `src/App.tsx` (ProtectedRoute with `modulePath`)
- Module scaffold under `src/features/refactor-dashboard/`:
  - `RefactorDashboardPage.tsx` — 6-tab shell (Overview · Backlog · Decisions · Compare · Proposals · drill-down)
  - `hooks/useRefactorMarkdown.ts` — `import.meta.glob` auto-discovers all `workflows/W*.md` + 3 top-level state docs
  - `components/MarkdownBlock.tsx` — react-markdown + remark-gfm + tailwind-prose styling
  - `components/StatusBadge.tsx` — 🟢/🟡/🔴/🔵 color mapping
  - `views/` — 6 view panels
  - `proposals/` — registry for custom mockup React components
- Deps added: `react-markdown`, `remark-gfm`, `rehype-raw`

**Phase 2 — W11.02 (planned, Week 2, blocked by W02)**
- **Modules tab** — list every module in the app (from W02 output). For each module, show: route, pages, components used, hooks, services, DB tables.
- **Module drill-down** — click a module → see its internals. Flag which components are shared vs local.
- Interactive Mermaid DAG (not ASCII)
- Workflow progress bars (subtasks done / total)

**Phase 3 — W11.03 (planned, Week 3, blocked by W07+W17)**
- **Components tab** — flat list of all reusable components. For each: where used, how many call sites, duplication cluster ID from W02, status (keep · refactor · deprecate · split).
- **Refactor planner** — from W02's duplication map, propose "merge these N files into one shared primitive" with diff preview.
- Candidates come from W07 primitives design + W17 component library.

**Phase 4 — W11.04 (planned, Week 4, blocked by W08)**
- **Design specs per page** — from W08 tokens + W17 mockups. Each page has its canonical design snapshot.
- Motion signature moments demo strip.
- "What's different from spec" drift alerts.

**User's future-vision notes (captured 2026-04-18)**:
*"list all modules → inside each module list all components → another page to show all components across the app → from there plan which to refactor, which have duplicates, how to restructure"*. Phases 2-3 above cover exactly this. The dashboard becomes the refactor cockpit, not just a status page.
