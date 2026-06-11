# App Base — Reusable Project Template

A clean, **empty-but-fully-wired** starting point for new internal apps, extracted from a
production React + Supabase portal. It keeps the *foundation* and strips every business feature.

**Stack:** React 18 · TypeScript · Vite · Supabase (PostgreSQL + Auth + Edge Functions) ·
shadcn/ui · TailwindCSS v4 · React Query · Playwright.

---

## What's inside

| Area | Kept | Notes |
|---|---|---|
| **Tooling** | vite · vitest · eslint · tsconfig · playwright · knip · dependency-cruiser · husky | all configs, genericized |
| **`.claude/`** | skills · 27 commands · agents · 20 rules · hooks | the workflow + skills system (the point of this base) |
| **Design system** | `src/components/primitives/**` (≈140 primitives) + `src/components/ui/**` (shadcn) | full component library, domain-decoupled |
| **App shell** | `AuthContext` · `ProtectedRoute` · `DashboardLayout` · `GlobalCommandPalette` (⌘K) · `ErrorBoundary` | module-based RBAC wiring |
| **Generic libs** | `lib/utils` · `lib/pagination` · `lib/design` (ThemeProvider/dark-mode) · `lib/supabase` (typed-client) · `utils/*` (timezone, toast, currency, queryKeys…) | |
| **Chrome hooks** | `useViewAs` · `useNotificationsBell` · `useDashboardChrome` · `useURLPagination` · `useDebounce` · … | |
| **Docs** | methodology only — SOPs, module-creation, compliance checklist, design catalog, architecture patterns | `docs/03-features/*` business docs removed |
| **DB** | one foundation migration (`supabase/migrations/`) + 2 edge-fn templates (`pdf-generation`, `resend-webhook`) + `_shared/cors.ts` | 457 domain migrations + ~50 domain functions removed |
| **Tests** | Playwright harness, POMs, fixtures, runners (auth/supabase) | feature specs removed |

**Stripped:** all 53 business features (`src/features/*`), their lib/hooks/migrations/docs/tests,
all live credentials, and the original project's identity.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure Supabase
cp .env.example .env          # fill VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
supabase link --project-ref <your-ref>

# 3. Apply the foundation schema (users + roles + modules + RBAC + RLS + notifications)
#    via the Supabase MCP (apply_migration) or:
supabase db push

# 4. Generate real DB types (replaces the permissive placeholder in src/integrations/supabase/types.ts)
npm run db:types
#    then point src/integrations/supabase/types.ts at the generated supabase/remote_types.ts

# 5. Run
npm run dev
```

Create your first user by signing up, then in SQL set them up as an admin:

```sql
update public.users set role = 'super_admin', is_approved = true where email = 'you@example.com';
-- also set the JWT app_metadata.role (capability RLS reads it):
-- Dashboard → Authentication → user → app_metadata: { "role": "super_admin" }
```

`/login` → `/dashboard` (placeholder Home page listing your modules). Press **⌘K** to search modules.

---

## Replace these placeholders

The original identity was scrubbed to neutral tokens — search & replace for your project:

| Token | Means | Where |
|---|---|---|
| `App Base` | project name | `CLAUDE.md`, `index.html`, `CONTEXT.md` |
| `Your Company` | company name | docs, `index.html` |
| `your-app.example.com` | prod domain | `CLAUDE.md`, `main.tsx` prod-host check |
| `your-project-ref` | Supabase project ref | `.env`, `.mcp.json`, `supabase/config.toml` |
| `your-team`, `com.yourcompany.cron`, Mac-mini SSH/CI refs | original CI/ops infra | a few ops docs + `.claude/commands/{git-check-mac-mini,write-workflow-test}.md`, `.github/` |

Swap branding assets in `public/` (`favicon.png`, `jl-logo.svg`, `images/`).
`.mcp.json` reads `${SUPABASE_ACCESS_TOKEN}` / `${SUPABASE_PROJECT_ID}` from your env.

---

## Building a feature

The `.claude` workflow is the reason this base exists. Type `/` to see commands. Typical flow:

1. `/create-module <name>` — scaffolds the canonical feature folder + lazy route + module-registration migration stub + CONTEXT.md.
2. `/prd-write` then `/prd-execute` — research-backed PRD, then delegated multi-agent execution.
3. `/check-module <name>` — audits against the 11-gate Definition of Done + primitive-coverage + architecture greps.
4. `/check-repo`, `/code-review`, `/health-check` — repo-wide gates.

The **Hard Rules** in `CLAUDE.md` (RLS, module-access, query bounds, timezone, toast, dark-mode, primitives-only)
auto-enforce via `.claude/rules/*` (scoped by `paths:`) and `scripts/check-repo.sh`.

Add a feature route as a child of the `DashboardLayout` group in `src/App.tsx`, wrapped in
`<ProtectedRoute modulePath="/your-path">`, and register the module row in `public.modules` + `role_modules`.

---

## Good to know

- **Build gate is `npm run build`** (Vite/esbuild) — it passes clean. The root `tsc --noEmit`
  (what the husky pre-commit runs) also passes. A strict `tsc -p tsconfig.app.json --noEmit` surfaces
  ~12 pre-existing strict-mode warnings in design-system primitives (inherited from the source project)
  plus a few generic-overload warnings in `lib/supabase/typed-client.ts` that **disappear once you
  generate real Supabase types** (step 4). None block the build or commits.
- **`src/integrations/supabase/types.ts`** is a permissive placeholder so foundation code type-checks
  against any table/RPC name. Replace it with generated types for real column-level safety.
- **Capability RLS reads `auth.jwt() → app_metadata.role`**, not `public.users.role`. Keep them in sync
  on role change (an admin RPC / DB webhook calling `auth.admin.updateUserById`). `AuthContext` self-heals
  a stale JWT via `refreshSession()`.
- **`handle_new_user()` is hardened** — new signups land as unapproved `supervisor`; an admin grants the
  real role + approval. Tune in the foundation migration.
- This folder is **not a git repo** — run `git init` to start your history.
