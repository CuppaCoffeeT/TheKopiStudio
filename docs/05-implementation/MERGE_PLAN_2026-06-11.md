# Advisor Suite — Merge Plan: Prospect Profiler + Insurance CRM

*Prepared 2026-06-11 · based on a full recon of both codebases, the project base template, and the live Supabase data*

---

## 1. What exists today

### Prospect Profiler (`~/Documents/Projects/Prospect profiler`)
- **What it is:** Mobile-first DISC × MBTI prospect-profiling tool for SG financial advisors. 7-step wizard (8 conversational questions + ~53 body-language observations + occupation nudge) → generates a communication playbook (openers, appointment-setting, objection handling, closes) with PDF/CSV export.
- **Stack:** Plain vanilla-JS hash-router SPA (no build step), ~1,400 LOC across 10 script files in `public/`, deployed to Vercel as static files. The root `ProspectProfiler_Mobile (17).index.html` is a frozen pre-Supabase backup — not deployed.
- **Data:** Supabase project **mymzcbalyqqgdmzsfmam** — `profiles` (2 rows) + `results` (8 rows), 2 auth users. This is the project this session's Supabase MCP is connected to.
- **Auth:** Email+password, optional (wizard is public; login only to save/view results). Roles: advisor / manager (manager sees all results, Manage Accounts page).
- **Known defects:** anonymous auto-save silently fails (user_id NULL vs NOT NULL + RLS); manager promote/demote and manager delete have **no backing RLS policies** (UI lies); `doLogout()` defined twice; XSS gaps in result rendering; viewing a saved result clobbers in-progress wizard state.

### Insurance CRM (`~/Documents/Projects/Insurance CRM`)
- **What it is:** Client/policy CRM for an SG insurance advisor: clients (incl. CPF OA/SA/MA + bank balances), policies (life/CI/ILP/hospitalization incl. Integrated Shield premium split), interactions + follow-up reminders, bank-balance history, and rich printable reports (CPF projection to 55 with BHS overflow + BRS/FRS/ERS tables, retirement projection to 65, coverage-gap analysis, financial health snapshot).
- **Stack:** Vite 5 + React 18 + react-bootstrap, ~3,100 LOC in `src/` — this is the real app. The 175KB `insurance_crm (29).html` is the legacy localStorage prototype, superseded but possibly still holding real data in some browser's localStorage.
- **Data:** Supabase project **uivdgousiyfeyrebloaz** (different project!) — 5 tables (`clients`, `policies`, `projected_cash_values`, `interactions`, `bank_balance_history`), per-user RLS. **This session's MCP cannot reach it** — row counts unknown until dashboard access is confirmed.
- **Auth:** Email+password, single-user-scoped (no roles).
- **Known defects:** bank-balance total drifts on non-latest edits/deletes; whole-dataset refetch after every mutation; no tests covering the financial math; plaintext Supabase personal access token sitting in `.mcp.json` (rotate it).

### project base (`~/Documents/Projects/project base`)
- **What it is:** AppBase — React 18 + TS + Vite + Tailwind/shadcn template with a ~140-primitive design system, DB-driven module RBAC (`roles`/`modules`/`role_modules`/`rls_capabilities` + `get_user_modules`), Playwright/Vitest harness, and the full `.claude` workflow system (`/create-module`, `/prd-write`, `/prd-execute`, 9-gate Definition of Done).
- **State:** Not yet a git repo; placeholders (`your-project-ref`, App Base branding) must be replaced; ships only Login/Home/NotFound pages — everything else is built as feature modules.

### Key data finding
The two apps use **different Supabase projects**. The Profiler's project (mymzcbalyqqgdmzsfmam) is MCP-reachable and tiny (2 users, 10 rows). The CRM's project (uivdgousiyfeyrebloaz) is not reachable from this session, and the CRM may *also* have real data stranded in browser localStorage from the legacy HTML app.

---

## 2. Recommended architecture (Option A)

**Build the merged app fresh from project base, with two feature modules — `src/features/profiler/` and `src/features/crm/` — on the Profiler's existing Supabase project (mymzcbalyqqgdmzsfmam) as the canonical database.**

Why this wins:
1. **Both UIs need rebuilding anyway.** The Profiler is ES5 globals with real defects; the CRM's react-bootstrap CSS can't be dropped into another host without a rewrite. What ports cleanly is the *logic* — `calcPf()`/`occNudge()` scoring, the question/playbook content, `utils/finance.js` CPF math — and that ports equally well into AppBase.
2. **AppBase's module RBAC is exactly the merged app's auth model.** Advisor/manager with manager-sees-all is currently *broken at the RLS layer* in the Profiler; AppBase's roles/capabilities system fixes it properly.
3. **Only option with a test harness.** The CRM's CPF/retirement math has zero coverage — golden-master Vitest tests lock it during the port.
4. **Data is tiny**, so "keep the codebase to keep the data" carries no weight.

Rejected alternatives:
- **B: Graft CRM into the Profiler's vanilla-JS app** — rewriting 3,100 lines of React into ES5 globals is more work for a worse result.
- **C: Adopt the CRM repo as host** — abandons project base, and the advisor/manager RBAC the Profiler needs would have to be built from scratch anyway, eroding the effort savings.

### Feature → module mapping (highlights)
| Source | Lands at |
|---|---|
| Profiler wizard | `/profiler` (TOOL archetype) |
| Saved results list/detail + playbook | `/profiler-results` (LIST + DETAIL) — exact path per base URL standards TBD |
| CRM dashboard | `/crm` (DASHBOARD, KPI tiles) |
| Clients + policies + interactions + bank | `/clients` (LIST) + `/clients/:id` (DETAIL with tabs); modals as FORM archetype |
| Per-client financial report | `/clients/:id/report` (decomposed report components, print CSS) |
| Portfolio report | `/crm-reports` (TOOL) |
| Account Settings | settings module (must be **built** — base doesn't ship one) |
| Manage Accounts (promote/demote) | admin module + **role-sync edge function** (service-role `auth.admin.updateUserById` — required, base doesn't ship it) |
| Both apps' auth screens | One foundation auth flow (`/login` + recovery page to be built) |

**Prospects vs clients:** keep separate, bridged — nullable `results.client_id` FK, a "Convert to client" action on a result, and a DISC/MBTI communication-style card on the client detail when linked. (Both features access the shared tables via their own `api/` services; navigation links only — satisfies the no-cross-feature-imports rule.)

---

## 3. Data migration plan (corrected sequencing)

**Canonical target:** mymzcbalyqqgdmzsfmam (keeps the 2 existing users' passwords; MCP already connected). uivdgousiyfeyrebloaz gets drained and decommissioned.

- **Step 0 — BACKUP + RESCUE (blocking, before anything):**
  - pg_dump/CSV snapshot of the canonical project (minutes — it's 10 rows).
  - **localStorage rescue:** on the exact browser/origin where `insurance_crm (29).html` was used, open devtools and copy `localStorage.getItem('insuranceCRM')` plus any `insuranceCRM.imported.*` / `.dismissed.*` keys. (Note: localStorage is per-origin — if the HTML was opened via `file://`, the React app's importer *cannot* see that data; devtools extraction is the only safe path.)
  - Confirm dashboard access to uivdgousiyfeyrebloaz (need its service_role key for export).
- **Step 1 — Foundation, non-breaking:** apply AppBase's foundation migration (fresh timestamp) to the canonical project *additively*. **Defer all breaking changes** (dropping `handle_new_user`, dropping `profiles`, rewriting `results` RLS) **until cutover** — the old Profiler stays live in production against this same DB during the build.
- **Step 2 — Users:** backfill `public.users` from `profiles` (same UUIDs), keep `username`, seed roles advisor/manager, one-time JWT `app_metadata.role` backfill, SQL-promote owner to super_admin.
- **Step 3 — CRM tables first:** create the 5 CRM tables (AppBase conventions: FKs → `public.users`, covering indexes, owner-scoped RLS `user_id = (SELECT auth.uid())` — an explicit, recorded extension of AppBase's 3 RLS patterns). *Then* the `results.client_id` FK can be added (FK ordering fix).
- **Step 4 — CRM data import:** `scripts/migrate-crm.mjs` with the source project's service_role key → export 5 tables → remap `user_id` by email → FK-ordered insert → recompute `clients.total_bank_balance` from latest history row (fixes the drift bug at the source) → row-count + spot-check verification.
- **Step 5 — Cutover:** repoint/retire breaking pieces (trigger, profiles table, results RLS rewrite), take old deployments offline (freezing repos is not enough — deployed apps keep serving), update Supabase Auth URL whitelist + email settings, rotate the leaked `sbp_` token, pause uivdgousiyfeyrebloaz after a verification window.

---

## 4. Delivery phases (via /prd-write → /prd-execute)

| Phase | Work | Est. |
|---|---|---|
| 0. Bootstrap (manual) | Copy base → new space-free repo, git init **+ create GitHub remote + push main** (prd-execute needs origin/main), replace placeholders, point at canonical Supabase, foundation migration (additive), backfill users, regen types | 0.5–1 d |
| 1. PRD "data-spine" | RLS pattern decision recorded; CRM tables + capabilities; **role-sync edge function**; migrate-crm.mjs run + verify (after Step 0 rescue/backup) | 1.5–2.5 d |
| 2. PRD "profiler module" | Wizard + results list/detail + playbook, scoring/content port with golden-master tests, explicit save, **+ Account Settings & Manage Accounts modules** | 3–5 d |
| 3. PRD "crm module" | Clients/policies/interactions/bank, finance.ts single-sourced + golden-master tests, dashboard KPIs, follow-up badges (incl. `next_review_date` fallback) | 3–5 d |
| 4. PRD "reports + link" | Client report (decomposed), portfolio report, prospect→client conversion + DISC card; port-or-drop legacy report extras | 2–3 d |
| 5. Cutover | Vercel project, auth whitelist + email config, final data delta, verification, decommission old apps | 0.5–1 d |

**Total: roughly 10–17 focused days** of agent-driven build (each PRD phase runs through the multi-agent /prd-execute pipeline with the 9-gate DoD).

---

## 5. Top risks
1. **Live-prod transition window** — the old Profiler serves production traffic from the same DB being remodeled; all breaking DB changes must wait for cutover (sequenced above).
2. **CRM data location unknown** — real data may exist only in one browser's localStorage; if that profile is wiped first, it's unrecoverable. Rescue is Step 0 and only the user can do it.
3. **uivdgousiyfeyrebloaz access** — entire CRM export hinges on its dashboard/service-role key.
4. **Financial math regressions invisible without tests** — port from `src/utils/finance.js` only, single-source, golden-master before touching UI; constants (BHS $79k, BRS/FRS/ERS 2023–2027, CPF LIFE $1,780) need an annual update process.
5. **JWT/role sync** — capability RLS reads `app_metadata.role`; promote/demote requires the service-role edge function (scheduled Phase 1), else Manage Accounts is a no-op like today.
6. **Effort realism** — react-bootstrap → Tailwind primitives is a visual rebuild, and the ≤200 LOC ratchet forces decomposing the 571-line report modal and 424-line data hook. Treat as design work, not transcription.

## 6. Decisions needed from you
1. Confirm Option A (fresh from base, two modules, profiler's Supabase project canonical).
2. Wizard: require login (fixes the silent-save bug) or stay public?
3. Managers: see all advisors' CRM books, or private books (manager oversight on profiler results only)?
4. Where is the real CRM data (Supabase / legacy HTML localStorage / both / test-only)? And do you have the uivdgousiyfeyrebloaz dashboard login?
5. Same person/email across both apps' accounts? (drives user remapping)
6. App name + production domain (branding placeholders, auth whitelist).
7. Port or drop legacy-only report extras (Priority Action Items, Universal Life type, Medisave AWL explainers, interactions in portfolio report)?
8. Keep PWA manifest (installable shell, no offline)?
