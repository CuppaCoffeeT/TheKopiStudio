# Tests — Playwright Multi-Tool Seatbelt

Workflow-driven Playwright suite + supporting POM, runners, and fixtures. The W04 multi-tool evidence harness (Playwright + Supabase + NAS + Gmail + ghost-os) lives here. Tests gate every push (W22).

## Scope

**Belongs**: workflow specs, page-object models, multi-tool runners, shared fixtures.
**Doesn't**: app code (`src/`); test *plans* / specs as docs (`docs/05-implementation/active/W04*`).

## Navigation

| Folder | Purpose |
|--------|---------|
| `workflows/` | One subfolder per module — `*.spec.ts` files driving real user flows (144 rows in WORKFLOW_LEDGER) |
| `pom/` | Page Object Models — `LoginPage`, `QuotationCreatePage`, `responsiveTabs` helper |
| `runners/` | Multi-tool runners — `agentTick`, `nasChecks`, `supabaseChecks`, `quotationChecks`, etc. |
| `fixtures/` | Shared test data — `testUsers.ts` (admin + coordinator/supervisor/storeman role accounts) · `roleAuth.ts` (`authFileFor` + `loginAs`) |
| `_explore-failures/` | Capture from `/explore-module` runs (do not commit broken flows here) |

## Before working here

- **Ledger or it didn't happen**: every spec must register a row in [WORKFLOW_LEDGER.md](../docs/99-refactor/_system/ledgers/WORKFLOW_LEDGER.md) — 15-col shape parsed by the refactor dashboard. Specs without a ledger row do not count toward W03 coverage.
- **Hard-delete + zero-residue**: every spec cleans up its own data via `tests/runners/*` — no `is_test_data=true` leftovers.
- **Selectors**: `data-testid` only — never CSS class names (rule: don't break on style refactors).
- **Multi-tool evidence**: a workflow may need 2+ tools (Playwright UI + Supabase row check + NAS file check). Compose runners; don't replicate query logic.
- **Auth (multi-role)**: real plus-addressed role accounts — `admin` (`aigent@`, super_admin) + `coordinator` / `supervisor` / `storeman` (`aigent+<role>@`). The parallel config's `setup` project signs each in once and saves a per-role `tests/.auth/<role>.json`; authed specs reuse the admin session, role-scoped specs opt in via `test.use({ storageState: authFileFor('<role>') })`. The View-As preview is client-only and CANNOT exercise RLS — per-role tests use REAL logins. Creds load from BOTH `.env.secrets` files (volume = `AIGENT_*`/`SUPABASE_*`; repo-local = `TEST_<ROLE>_*`). The logged-out `workflows/auth/**` specs sign in through the UI (`LoginPage` / `loginAs`) and run with NO storageState. See [PARALLEL_E2E_TESTING.md](../docs/06-operations/PARALLEL_E2E_TESTING.md) + [PER_ROLE_E2E_TEST_HARNESS_PLAN.md](../docs/05-implementation/active/PER_ROLE_E2E_TEST_HARNESS_PLAN.md).
- **Run**: `npx playwright test --project=chromium-desktop` (or `mobile-safari`). Use `tests/pom/responsiveTabs.ts` to write specs that pass on both.
- **3-tier scripts**: `test:e2e:failed` (`--last-failed`, inner loop) · `test:e2e:pushgate` (`@pushgate`, fast push gate — 6 fast read-only specs) · `test:e2e:comprehensive` (full `@p0`, Mini nightly). `test:e2e:smoke` (`@smoke`) = broader on-demand bucket incl. heavier DB-writing journeys (e.g. `prod-recovery-journey`) kept OUT of the push gate. Pre-push (husky) now runs **`@pushgate`**, not `@p0`. Tiers + scopes: [PARALLEL_E2E_TESTING.md](../docs/06-operations/PARALLEL_E2E_TESTING.md).

## Decisions & Lessons

- `workflows/decisions.md` · `workflows/lessons.md` — selector / runner conventions + past failures (Radix Popover race, Synology code 119, TableRow onClick)

## 📚 Related

- [W03_WORKFLOW_INVENTORY.md](../docs/99-refactor/_system/workflows/W03_WORKFLOW_INVENTORY.md) · [W04_PLAYWRIGHT_SEATBELT.md](../docs/99-refactor/_system/workflows/W04_PLAYWRIGHT_SEATBELT.md) · [W22_CI_GATES.md](../docs/99-refactor/_system/workflows/W22_CI_GATES.md)
- [WORKFLOW_LEDGER.md](../docs/99-refactor/_system/ledgers/WORKFLOW_LEDGER.md)
