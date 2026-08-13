# Prospect Profiler — Advisor Suite (built on App Base)

Reusable starter for new internal apps. Replace this header with your project name + company.
React 18 + TypeScript + Vite + Supabase (PostgreSQL) + shadcn/ui + TailwindCSS + React Query
Production: www.thekopistudio.com (Vercel project `thekopistudio`; apex 308s to www)


## Output Style (chat + .md)
- Direct answer. No narration/filler/preamble. Drop 'a/the/is/am/are'
- Short imperatives (3-6 words)
- Run tools, show result, stop
- Tables > bullets > prose. Never prose walls
- **4 chars ≈ 1 token.** Budgets = ceilings, not targets
When touching any file: check for inconsistencies, redundancy, stale references.
Before working in a workspace, check for `decisions.md` / `lessons.md` there.
File rules + budgets live in [docs/99-meta/TOKEN_BUDGET.md](docs/99-meta/TOKEN_BUDGET.md).

## Commands

npm run dev · build · db:types
Slash commands: type `/`, or see [.claude/commands/CONTEXT.md](.claude/commands/CONTEXT.md) (full list + purpose).

## Routing

**Read first → [CONTEXT.md](CONTEXT.md)** — task → which doc to open. Load on demand; route, don't bulk-load.

## Hard Rules (always apply)

1. RLS: minimal authenticated policy on all tables (.claude/rules/rls-policy.md)
2. Access: module-based via useAuth(), never hardcoded role checks (.claude/rules/module-access.md)
3. FK refs: public.users(id) always, never auth.users(id)
4. Queries: every .select() needs .range(), .limit(), or .single() (.claude/rules/query-compliance.md)
5. Dates: timezoneUtils only, never raw date-fns (.claude/rules/timezone.md)
6. Toast: showSuccess/showError only, no useToast (.claude/rules/toast-system.md)
7. Memory: append non-obvious lessons to `<workspace>/lessons.md`, decisions to `<workspace>/decisions.md` (.claude/rules/lessons-logging.md)

## Memory Rules

Per-workspace `decisions.md` + `lessons.md` — read before working in a folder, append after non-obvious work. Format, when-to-log + promotion rules: [.claude/rules/lessons-logging.md](.claude/rules/lessons-logging.md). User prefs → Claude Code auto-memory (`memory/`), not here.

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.tsx | `QuotationList.tsx` |
| Utilities | camelCase.ts | `timezoneUtils.ts` |
| Database | snake_case | `work_entries`, `client_contacts` |
| Docs | SCREAMING_SNAKE_CASE.md | `MODULE_SYSTEM.md` |
| Migrations | YYYYMMDD_HHMMSS_desc.sql | `20260315_143022_add_people_table.sql` |
| URLs (single concept) | no hyphens | `/clientprofiles`, `/generalworks` |
| URLs (multi-word) | hyphens | `/ot-calculator`, `/drafter-dashboard` |

## Structure

`src/` app · `docs/` numbered categories · `supabase/` migrations+functions (MCP only) · `.claude/` rules·commands·agents · `tests/` Playwright. See each folder's CONTEXT.md.

## MCP

Supabase project_id `mymzcbalyqqgdmzsfmam` — MCP only, NEVER CLI for DB changes. Prod is the only DB (branching deferred to W5). GitHub MCP available. Detail: [supabase/CONTEXT.md](supabase/CONTEXT.md).
