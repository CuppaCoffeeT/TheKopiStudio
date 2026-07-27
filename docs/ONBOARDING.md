# AppBase — Onboarding (Humans + AI Agents · START HERE)

**Created**: 2026-05-31 SGT
**Last Updated**: 2026-05-31 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

One page that explains **how this codebase is organised, what rules it follows, and — critically for AI agents — how to navigate the docs + code without loading everything**. AppBase = the construction-operations portal for Your Company (`your-app.example.com`). Stack: **React 18 + TypeScript + Vite + Supabase (PostgreSQL) + shadcn/ui + TailwindCSS + React Query**.

This doc **routes** — it does not duplicate. Each section links to the one authoritative source. Read this, then follow the links *only for what your task needs*.

---

## 1. The cardinal rule for AI agents: load on demand, route — never bulk-load

The repo uses a **5-layer context hierarchy (MWP — Minimal Working-context Pattern)**. The whole point is to keep a task at **2,000–8,000 tokens of context, not tens of thousands**, so your context window survives the task. **You do not read everything. You start at the entry point and follow the routing tables down only the branch your task needs.**

| Layer | File(s) | Role | When you load it |
|---|---|---|---|
| **0 — Entry** | root `CLAUDE.md` | Project identity + the **Routing table** (task → read-first doc) + Hard Rules | Always (it's small by design) |
| **1 — Workspace router** | `src/CONTEXT.md` · `docs/CONTEXT.md` · `supabase/CONTEXT.md` · `.claude/CONTEXT.md` | "Which room am I in, where do I go next" | When you enter that workspace |
| **2 — Subfolder router** | `CONTEXT.md` inside a folder (created only where a folder has 3+ files/subfolders) | Local contract: what's here, navigation table, before-working-here rules | When you work in that folder |
| **3 — Stable reference** | `.claude/rules/**`, `docs/01-system-architecture/**`, `docs/03-features/**`, `docs/06-operations/**` | "How it works today" — internalise as constraints | Only the rule/spec your change touches |
| **4 — Task artifacts** | `docs/05-implementation/active/**`, the files you're editing | The working set for this task | The specific plan + files |

**How to navigate** (the routing chain): `CLAUDE.md` (Routing table) → the Layer-1 `CONTEXT.md` for the workspace → the Layer-2 folder `CONTEXT.md` → the Layer-3 rule/spec it points to → the Layer-4 file you edit. **`.claude/rules/` are scoped by `paths:` frontmatter and auto-load only when you edit matching files** — don't pre-read them all.

**Why**: always-loaded files (`CLAUDE.md`, every `CONTEXT.md`) cost tokens on *every* turn; routing files must route, not carry detail. Big files force scanning instead of reading and don't survive context compaction. → Authoritative: [99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md](99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md) · routing map [CONTEXT_MAP.md](CONTEXT_MAP.md).

---

## 2. Token budget — every doc has a ceiling

Routing files stay small so they stay cheap. **Budgets are ceilings, not targets** (aim 60–70% utilisation).

| File | Max | Over-budget action |
|---|---|---|
| root `CLAUDE.md` | 3,200c / 90 lines | extract detail to `docs/99-meta/` |
| Feature `CONTEXT.md` | 1,600c / 80 lines | routing-only; push detail to a sibling guide |
| Category `CONTEXT.md` | 2,400c / 120 lines | same |
| Guide (SOP/spec) | 8,000c / 200 lines | split by sub-topic |
| Feature / Reference doc | 12,000c / 15,000c | split into linked sub-files |
| `decisions.md` / `lessons.md` | 50 entries | archive older-than-6-months |

~4 chars ≈ 1 token. → Authoritative + exemption list: [99-meta/TOKEN_BUDGET.md](99-meta/TOKEN_BUDGET.md).

---

## 3. Codebase organisation — `src/` (4-tier, Bulletproof React)

The target `src/` shape is **REALIZED** as of 2026-05-31. Single source of truth: [99-refactor/_system/ARCHITECTURE_BLUEPRINT.md](99-refactor/_system/ARCHITECTURE_BLUEPRINT.md).

```
src/
├── features/<name>/          ← one folder per module (51). api/ components/ hooks/ lib/ pages/ types.ts index.ts CONTEXT.md
├── components/               ← ONLY 3 subtrees (enforced by dep-cruiser no-stray-domain-components):
│   ├── primitives/<group>/   ←   design-system primitives (stateless, design-spec-backed) — import these in new code
│   ├── ui/                   ←   shadcn base + sanctioned domain wrappers
│   └── shared/<domain>/      ←   cross-feature surfaces used by ≥2 features
├── hooks/                    ← cross-feature/global hooks only (NEVER imports from features/)
├── lib/<domain>/             ← infra + multi-consumer domain logic (services drained here)
├── utils/                    ← pure functions (queryKeys, timezoneUtils, toastHelper…)
├── pages/                    ← thin route shells only (NotFound, RouteError)
├── contexts/ · integrations/ ← AuthContext · Supabase client + generated types
└── main.tsx · App.tsx        ← entry + router wiring
```

**The 4-tier component decision (where does a component go?)**
| Used by… | Goes in |
|---|---|
| exactly 1 feature | `features/<that-one>/components/` |
| ≥2 features (UI) | `components/shared/<domain>/` — **never mirror into a feature** (creates a forbidden cross-feature edge) |
| ≥2 features (pure logic) | `lib/<domain>/` |
| design-system primitive | `components/primitives/<group>/` (needs a design spec) |
| dead (0 importers) | delete (knip-confirm) |

Feature folder shape: [01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md](01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md). New modules: [06-operations/MODULE_CREATION_SOP.md](06-operations/MODULE_CREATION_SOP.md) (`/create-module`).

---

## 4. The hard rules (always apply)

Full enforcement patterns: [`.claude/rules/`](../.claude/rules/) (auto-load by `paths:`). The non-negotiables:

| Rule | One-liner | Source |
|---|---|---|
| **File size** | Every file targets **≤200 LOC**; no new >1000-LOC god-files. Ratchet: `npm run loc:check` | `scripts/loc-ratchet.mjs` |
| **Primitives-only** | Import `@/components/primitives/**` (+ sanctioned `ui/`); no raw shadcn, no raw `<button>/<input>/<select>/<textarea>/<label>/<h1>` | `.claude/rules/ui-components.md` |
| **Module RBAC** | Gate pages with `useAuth().modules.some(m => m.path === '/route')` — **never** hardcoded role strings | `.claude/rules/module-access.md` |
| **RLS** | Minimal authenticated policy on every table + capability-gated writes (`has_capability()`); pin `search_path` on SECURITY DEFINER | `.claude/rules/rls-policy.md` |
| **FK** | Always `public.users(id)` / `public.people(id)` — **never** `auth.users(id)` (only `public.users` references auth) | PEOPLE_SYSTEM |
| **Queries** | Every `.select()` has `.range()` (lists) / `.limit()` (dropdowns) / `.single()` (detail) | `.claude/rules/query-compliance.md` |
| **Dates** | `@/utils/timezoneUtils` only (SGT, UTC+8) — never raw `date-fns` formatting | `.claude/rules/timezone.md` |
| **Toasts** | `showSuccess` / `showError` from `@/utils/toastHelper` — no `useToast` | `.claude/rules/toast-system.md` |
| **Query keys** | `queryKeys` factory; mutations invalidate `.all` + `.detail(id)` | `.claude/rules/react-query.md` |
| **Theme** | Light-pinned Kopi Studio cream; cards sit one shade LIGHTER than the page; no `dark:` variants, no cool neutrals | `.claude/rules/light-theme.md` |
| **Mobile** | `dvh` not `vh`; 16px touch inputs; 44px targets; long forms = fullscreen Dialog | `.claude/rules/mobile-web.md` |
| **URLs** | single-concept = no hyphens (`/clientprofiles`); multi-word = hyphens (`/ot-calculator`). New lists use `useURLPagination` | `.claude/rules/url-standards.md` |
| **Hygiene** | Touching a file → 4 checks (inconsistency, redundancy, clarity, up-to-dateness); never delete debugging-history sections | `.claude/rules/code-hygiene.md` |
| **Memory** | Append non-obvious lessons/decisions to per-workspace `lessons.md` / `decisions.md` | `.claude/rules/lessons-logging.md` |

---

## 5. Core systems (read the spec for your task only)

| System | What to know | Spec |
|---|---|---|
| **Module / RBAC** | 3 tables (`modules`, `role_modules`, `user_modules`); user override > role default; roles are **dynamic** (`public.roles`, not an enum); register a module = migration (modules+role_modules rows) + `App.tsx` route with matching path | [01-system-architecture/MODULE_SYSTEM.md](01-system-architecture/MODULE_SYSTEM.md) |
| **People / contacts** | ALL individuals live in one `people` table; **role = existence of a row** in `workers`/`staff_employment`/`users`/`client_contacts` (no boolean flags); `users.person_id → people.id` bridges auth↔person | [01-system-architecture/PEOPLE_SYSTEM.md](01-system-architecture/PEOPLE_SYSTEM.md) |
| Database / RLS | RLS + FK + migration rules | [01-system-architecture/DATABASE_POLICY.md](01-system-architecture/DATABASE_POLICY.md) |
| Design system | tokens · primitives · 6 page archetypes | [01-system-architecture/DESIGN_SYSTEM.md](01-system-architecture/DESIGN_SYSTEM.md) |
| Workflow engine | status state machines | [01-system-architecture/WORKFLOW_SYSTEM.md](01-system-architecture/WORKFLOW_SYSTEM.md) |

> ⚠️ Some `01-system-architecture/` docs still contain **pre-refactor code-path examples** (e.g. `src/services/peopleService.ts`, `@/components/DashboardHeader`, `worker_employment` SQL). The **data model + rules are authoritative**; treat example *paths* as possibly-stale until reconciled (tracked in the re-refactor plan below).

---

## 6. The documentation system

`docs/` = **WHAT & WHY** · `src/` = **HOW** · `supabase/` = **WHERE (data)** · `.claude/rules/` = **CONSTRAINTS**.

| Category | Contains | Layer |
|---|---|---|
| `01-system-architecture/` | how core systems work | 3 (permanent) |
| `02-security/` | auth flows, policies | 3 |
| `03-features/` | feature behaviour specs | 3 |
| `04-integrations/` | external services | 3 |
| `05-implementation/` | plans — `active/` → `completed/` (lifecycle) | 4 (temporary) |
| `06-operations/` | SOPs, maintenance | 3 |
| `99-meta/` | standards (this system) | 3 |
| `99-refactor/` | the 2026 refactor program | 4 |

**Doc rules**: `SCREAMING_SNAKE_CASE.md`; required header (Created / Last Updated / Status / Priority); register in [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md); bidirectional links. A plan that ships → move `active/` → `completed/` + update the index. Full standard: [`.claude/rules/documentation.md`](../.claude/rules/documentation.md).

---

## 7. What the 2026-05-31 refactor did (and the current state)

A multi-phase structural + dead-code cleanup brought `src/` to the blueprint's "done-when":

- **`src/components/` reduced to `{primitives, ui, shared}`** — 17 legacy `src/components/<domain>/` folders + 13 loose root files were relocated (single-consumer → owning feature; ≥2-consumer → `shared/`/`lib/`) or deleted as dead.
- **Dead code purged** — knip unused-files **172 → 2** (2 documented false-positive keeps); 75 dead files + ~30 dead exports + 45 duplicate-export twins + 4 unused deps removed.
- **`src/{types,constants,styles}` drained + removed**; `src/services/` reduced to 2 facades + 3 subfolders (drain to `src/lib/` scheduled W25, *not* into features — they're multi-consumer); `src/hooks` root 116 → ~70.
- **`src/pages/` = 2 thin shells** (`NotFound`, `RouteError`); the baselined OTCalculator page→feature drift edge eliminated.
- **Enforcement landed**: a `no-stray-domain-components` dependency-cruiser rule (severity `error`) now fails CI on any new top-level `src/components/<domain>/` folder or loose root file.
- **Docs reconciled**: `docs/05-implementation/active` triaged 42 → **7** genuinely-active (35 completed plans archived); the 3 module commands (`/create-module`, `/check-module`, `/delete-module`) hardened to enforce folder structure.

Gate scorecard at close: **tsc 0 · drift 0 · build pass · LOC 238 ≤ 278 · knip 2 · @p0 378 pass**. Detail: [99-refactor/_system/ARCHITECTURE_BLUEPRINT.md](99-refactor/_system/ARCHITECTURE_BLUEPRINT.md) · [99-refactor/_system/RECENT_CHANGES.md](99-refactor/_system/RECENT_CHANGES.md) · [99-refactor/_system/lessons.md](99-refactor/_system/lessons.md).

---

## 8. Verify the standard at any time

```bash
npm run check:repo            # repo-wide drift scorecard (structure, residue, hooks, drift, LOC, primitives, CONTEXT, budget, knip, tsc)
npm run check:repo -- --full  # + production build
```

Per-module depth (RLS, the 5 W09 primitive greps, queryKeys, the 9-gate DoD): `/check-module <feature>`. Command doc: [`.claude/commands/check-repo.md`](../.claude/commands/check-repo.md).

## 📚 Related Documentation

- Entry point: root [CLAUDE.md](../CLAUDE.md) — Routing table + Hard Rules (read first, every session)
- [CONTEXT.md](CONTEXT.md) (docs router) · [CONTEXT_MAP.md](CONTEXT_MAP.md) (full routing tree) · [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- [99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md](99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md) · [99-meta/TOKEN_BUDGET.md](99-meta/TOKEN_BUDGET.md)
- [99-refactor/_system/ARCHITECTURE_BLUEPRINT.md](99-refactor/_system/ARCHITECTURE_BLUEPRINT.md) — the target `src/` shape (single source of truth)
- [06-operations/MODULE_CREATION_SOP.md](06-operations/MODULE_CREATION_SOP.md) — build a new module
