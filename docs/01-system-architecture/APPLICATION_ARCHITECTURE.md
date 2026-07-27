# Application Architecture

**Created**: 2026-05-30 12:00:00 SGT
**Last Updated**: 2026-05-30 12:00:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The **entry doc** for the AppBase Trench Trace Portal. A new dev or AI agent reads this first, then follows the links. It is **routing-only** — it does not restate the linked docs, it points to the authority for each topic. If this doc and a linked doc disagree, the **linked doc wins**.

---

## 1. What the app is

Construction-operations portal for Your Company Pte Ltd. Production: `your-app.example.com`.

**Stack**: React 18 + TypeScript + Vite + Supabase (PostgreSQL) + shadcn/ui + TailwindCSS + React Query. **49 feature folders** under `src/features/`. One database (prod) accessed via Supabase MCP — never CLI.

---

## 2. Where code lives

`src/features/<name>/` is the home for each feature (page + components + hooks + lib + service). Authority: [src/CONTEXT.md](../../src/CONTEXT.md).

**4 component tiers** (pick the highest tier that fits — never reach below it for new code):

| Tier | Lives in | Use when |
|------|----------|----------|
| **primitives** (135) | `src/components/primitives/` | First choice. Design-system parts. Authority: [design-system/PRIMITIVES.md](./design-system/PRIMITIVES.md) (verified inventory) · [UNIVERSAL_COMPONENTS.md](../99-refactor/_system/UNIVERSAL_COMPONENTS.md) (use · edit · create rulebook) · [primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) (⚠️ pre-Kopi, 2026-05-30) |
| **ui** | `src/components/ui/` | shadcn base + sanctioned domain wrappers only |
| **shared** | `src/components/shared/` | Used by ≥2 features — promote here, never mirror |
| **feature-local** | `src/features/<name>/components/` | Used by exactly one feature |

---

## 3. The 7 Hard Rules (always apply)

| # | Rule | Authority |
|---|------|-----------|
| 1 | Minimal authenticated RLS policy on every table | [rls-policy.md](../../.claude/rules/rls-policy.md) |
| 2 | Access via `useAuth().modules` — never hardcode role strings | [module-access.md](../../.claude/rules/module-access.md) |
| 3 | FK refs → `public.users(id)`, never `auth.users(id)` | [rls-policy.md](../../.claude/rules/rls-policy.md) |
| 4 | Every `.select()` needs `.range()`, `.limit()`, or `.single()` | [query-compliance.md](../../.claude/rules/query-compliance.md) |
| 5 | Dates via `timezoneUtils` only — never raw `date-fns` | [timezone.md](../../.claude/rules/timezone.md) |
| 6 | Toasts via `showSuccess` / `showError` — never `useToast` | [toast-system.md](../../.claude/rules/toast-system.md) |
| 7 | Append non-obvious lessons/decisions to per-workspace memory | [lessons-logging.md](../../.claude/rules/lessons-logging.md) |

---

## 4. System guides

| Topic | Authority |
|-------|-----------|
| Module / RBAC | [MODULE_SYSTEM.md](./MODULE_SYSTEM.md) |
| RLS · FK · migrations policy | [DATABASE_POLICY.md](./DATABASE_POLICY.md) |
| Query standards (`.range`/`.limit`/`.single`) | [SUPABASE_QUERY_STANDARDS.md](./SUPABASE_QUERY_STANDARDS.md) |
| React Query cache · keys · invalidation | [react-query-cache/CONTEXT.md](./react-query-cache/CONTEXT.md) |
| Timezone (SGT-only) | [TIMEZONE_POLICY.md](./TIMEZONE_POLICY.md) |
| URL / route conventions | [URL_STANDARDS.md](./URL_STANDARDS.md) |
| Mobile / touch-first | [MOBILE_WEB_STANDARDS.md](./MOBILE_WEB_STANDARDS.md) |
| Design system (router) | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) |
| Theming — the app is **light-pinned**, no dark mode | [design-system/DARK_MODE.md](./design-system/DARK_MODE.md) (legacy filename) |
| Authentication | [authentication/AUTHENTICATION_SYSTEM.md](./authentication/AUTHENTICATION_SYSTEM.md) |
| Clients / contacts data model | [CRM_DATA_SPINE.md](./CRM_DATA_SPINE.md) |
| Canonical page-archetype patterns (list · detail · form · dashboard · settings + feature-folder) | [canonical-page-patterns/CONTEXT.md](./canonical-page-patterns/CONTEXT.md) |

> The six canonical page-archetype specs live in [canonical-page-patterns/](./canonical-page-patterns/CONTEXT.md). Design tokens/primitives per archetype still route through [design-system/ARCHETYPES.md](./design-system/ARCHETYPES.md).

---

## 5. Build / check / delete a module

| Action | Authority |
|--------|-----------|
| **Build** a new module | [MODULE_CREATION_SOP.md](../06-operations/MODULE_CREATION_SOP.md) |
| **Audit** (8 gates) + **delete** checklist | [MODULE_COMPLIANCE_CHECKLIST.md](../06-operations/MODULE_COMPLIANCE_CHECKLIST.md) |

---

## 6. Quality gates

Run before pushing. Enforced by the husky `pre-push` hook (`.husky/pre-push`) + the seatbelt CI (Playwright `@p0` suite).

| Gate | Command | Pass condition |
|------|---------|----------------|
| Lint | `npm run lint` | ≤15 warnings (`eslint --max-warnings=15`) |
| Drift | `npm run drift:check` | baseline-diff clean · circular deps = 0 |
| LOC ratchet | `npm run loc:check` | no file exceeds its budget |
| Build | `npm run build` | `vite build` succeeds |
| E2E seatbelt | `npm run test:e2e:p0` | `@p0` Playwright suite green |

> `SKIP_E2E=1 git push` short-circuits only Playwright (keeps tsc + ESLint live).

---

## 7. The refactor program

In-place refactor toward Bulletproof-React + primitive-composed shape, tracked at `docs/99-refactor/_system/`.

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE_BLUEPRINT.md](../99-refactor/_system/ARCHITECTURE_BLUEPRINT.md) | Target architecture + locked defaults |
| [REMEDIATION_MASTER_PLAN_2026-05-29.md](../99-refactor/_system/REMEDIATION_MASTER_PLAN_2026-05-29.md) | Active remediation plan |

---

## 📚 Related Documentation

- [src/CONTEXT.md](../../src/CONTEXT.md) — code-layer router (read before editing code)
- [CONTEXT.md](./CONTEXT.md) — this folder's navigation index
- [../../CLAUDE.md](../../CLAUDE.md) — project instructions + routing table + Hard Rules
- [.claude/rules/CONTEXT.md](../../.claude/rules/CONTEXT.md) — all 14 auto-loaded rule files
