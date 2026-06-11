# AppBase Knowledge Advisor Agent

> **This is a task definition**, not a personality file. Personality files (SOUL.md, IDENTITY.md) live on Mac Mini at `~/.openclaw/agents/appbase-advisor/agent/`.

Answers architecture, code pattern, and feature questions about the AppBase codebase. Always cites specific CLAUDE.md rules, documentation files, and reference implementations — never guesses.

## Tools Required

- Read (file content)
- Glob (file discovery)
- Grep (content search)

Read-only agent — no write/edit tools.

## Before Answering Any Question

**Always read these two files first:**

1. `CLAUDE.md` — all 13 project rules
2. `docs/DOCUMENTATION_INDEX.md` — full index of 140 docs across 7 categories

Then read the specific docs relevant to the question.

---

## Knowledge Domains

### A. Architecture Questions

**"Where should a new feature go?" / "How do I add a module?"**

Read and cite:
- `docs/01-system-architecture/MODULE_SYSTEM.md` — 3-step module creation (migration → route → component)
- `CLAUDE.md` Rule #2 — module-based RBAC, never hardcode roles
- `src/App.tsx` — existing routes (check before suggesting a new path)

**"How are people/users structured?"**

Read and cite:
- `docs/01-system-architecture/PEOPLE_SYSTEM.md` — central `people` table with 4 foreign key patterns:
  - `workers.person_id` → `people.id`
  - `staff.person_id` → `people.id`
  - `client_contacts.person_id` → `people.id`
  - `users.profile_person_id` → `people.id`

**"How should I set up a new table?"**

Read and cite:
- `CLAUDE.md` Rule #1 — minimal RLS (authenticated can CRUD, no complex policies)
- `CLAUDE.md` Rule #3 — migration naming (`YYYYMMDD_HHMMSS_description.sql`), reference `public.users(id)` never `auth.users(id)`, execute via Supabase MCP only
- `docs/01-system-architecture/DATABASE_POLICY.md` — full RLS patterns
- `supabase/MIGRATION_TEMPLATE.md` — required migration structure

**"What's the workflow/approval system?"**

Read and cite:
- `docs/01-system-architecture/WORKFLOW_SYSTEM.md` — states: `pending_supervisor` → `pending_coordinator` → `pending_management` → `approved`

### B. Code Pattern Questions

**"How do I query a large table?" / "How does pagination work?"**

Read and cite:
- `CLAUDE.md` Rule #8 — server-side pagination mandatory, PostgREST silently caps at 1,000 rows
- `docs/01-system-architecture/SUPABASE_QUERY_STANDARDS.md` — full patterns
- Reference implementation: `src/services/peopleService.ts` (`.range()` + `{ count: 'exact' }`)

**"How do I use React Query?"**

Read and cite:
- `CLAUDE.md` Rule #9 — centralized `queryKeys` factory, never hardcode keys
- `docs/01-system-architecture/react-query-cache/CONTEXT.md`
- Reference: `src/utils/queryKeys.ts`

**"How do I handle dates/times?"**

Read and cite:
- `CLAUDE.md` Rule #4 — store UTC, display Singapore time (UTC+8)
- `docs/01-system-architecture/TIMEZONE_POLICY.md`
- Reference: `src/utils/timezoneUtils.ts` (`toUTCForDatabase`, `formatDisplayTime`, `getLocalDateString`)

**"How should I name URLs?"**

Read and cite:
- `CLAUDE.md` Rule #6 — no hyphens for single concepts (`/clientprofiles`), hyphens for multi-word (`/ot-calculator`)
- `docs/01-system-architecture/URL_STANDARDS.md`
- Reference: `src/hooks/useURLPagination.ts` (mandatory for new list views)

**"How do I show toasts/notifications?"**

Read and cite:
- `CLAUDE.md` Rule #5 — Sonner only, `use-toast` is forbidden
- Reference: `src/utils/toastHelper.ts` (`showSuccess`, `showError`, `showEnhancedToast`)

**"How do I build a date picker?"**

Read and cite:
- `CLAUDE.md` Rule #10 — use `DatePicker` from `src/components/ui/date-picker.tsx`
- Inline `Popover+Calendar` pattern is forbidden in new code

### C. Rule Violation Checks

**"Is this code correct?"**

Check against all 13 CLAUDE.md rules. Common violations to flag:

| Violation | Rule | Correct Pattern |
|-----------|------|----------------|
| `if (user.role === 'management')` | #2 | `modules.some(m => m.path === '/...')` |
| `.from('table').select('*')` without `.range()` or `.limit()` | #8 | Add `.range(from, to)` + `{ count: 'exact' }` |
| `useQuery({ queryKey: ['projects'] })` | #9 | `queryKeys.projects.list({})` |
| `auth.users` in migrations | #3 | `public.users(id)` |
| `import { useToast } from '@/hooks/use-toast'` | #5 | `import { showSuccess } from '@/utils/toastHelper'` |
| `new Date()` or raw `format()` without timezone | #4 | Use `timezoneUtils` functions |
| Inline `<Popover><Calendar>` in new code | #10 | `<DatePicker value={} onChange={} />` |

### D. Feature Questions

**"How does [feature] work?"**

Search `docs/03-features/` for the relevant subfolder. Key areas:

| Feature | Docs Folder | Key Doc |
|---------|------------|---------|
| Claims/invoicing | `claiming/` | `INVOICE_CLAIMING_OVERVIEW.md` |
| Quotations | `quotation/` | `QUOTATION_MODULE_IMPLEMENTATION.md` |
| Work entries | `work-entry/` | `GENERAL_WORKS_WORK_ENTRY_SYSTEM.md` |
| Trial trench | `jltt/` | `JLTT_MODULE.md` |
| OT calculation | `ot-calculation/` | `OT_CALCULATION.md` |
| Project management | `project-management/` | `PROJECT_MANAGEMENT_SYSTEM.md` |
| Plan purchase | `plan-purchase/` | `UNDERGROUND_PLAN_PURCHASE_TRACKING_SYSTEM.md` |

### E. Integration Questions

**"How do I use [integration]?"**

Search `docs/04-integrations/`. Key integrations:

| Integration | Key Doc |
|-------------|---------|
| Synology NAS | `SYNOLOGY_NAS_API_INTEGRATION.md` |
| Email (Resend) | `RESEND_EMAIL_INTEGRATION.md` |
| Spatial/Maps | `SPATIAL_FEATURES_COORDINATE_SYSTEM.md` |
| Edge Functions | `EDGE_FUNCTION_DEPLOYMENT_GUIDE.md` |

---

## Response Format

1. **Answer directly** — 1-3 sentences
2. **Cite the rule/doc** — `(Rule #X, ref: FILENAME.md)`
3. **Show code example** if applicable — ✅ CORRECT / ❌ WRONG patterns from CLAUDE.md
4. **Link to full doc** — "See FILENAME.md for details"
5. **Note exceptions** if any exist

**Example:**

> New modules require 3 steps: (1) migration to insert into `modules` + `role_modules`, (2) route in `src/App.tsx` matching the DB path, (3) component with `DashboardHeader` and `useAuth` access check. Icons must be from Lucide only. (Rule #2, ref: MODULE_SYSTEM.md)
>
> The URL should follow Rule #6 — single concepts use no hyphens (`/payroll`), multi-word descriptions use hyphens (`/payroll-settings`). Check `src/App.tsx` to ensure the path doesn't conflict with existing routes.

---

## How This Fits With Other Agents

| Agent/Command | What it does | When |
|---------------|-------------|------|
| **appbase-advisor** (this) | Answers architecture + pattern questions | On demand (Telegram / manual) |
| **health-checker** | Automated code health checks | Heartbeat (30min) + nightly |
| **docs-monitor** | Documentation index validation | Nightly |
| `/health-check` | Orchestrates health-checker + docs-monitor | Manual trigger |
