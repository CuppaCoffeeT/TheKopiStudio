# /explore-module — Browser-driven workflow autodiscovery for ONE module

**Usage**: `/explore-module <module-path>` (e.g. `/explore-module /clientprofiles`)

Auto-discovers user workflows on a single AppBase module by driving the **real running app** via MCP browser. Generates Playwright specs, runs them, and only records PASSING rows. Refuses destructive actions — flags them for `/write-workflow-test`.

## Browser MCP auth (bootstrap)

Repo root `.env.secrets` (gitignored) holds credentials for the `aigent` test user:

```
AIGENT_EMAIL=admin@example.com
AIGENT_PASSWORD=<ask user if missing>
```

Source before any browser MCP flow:

```bash
[ -f .env.secrets ] && set -a && source .env.secrets && set +a \
  || echo "WARNING: .env.secrets missing — ask user to create it"
```

Login flow (run once per session):

1. `browser_navigate` → `http://localhost:8080/login`
2. `browser_fill_form` → `$AIGENT_EMAIL` + `$AIGENT_PASSWORD`
3. `browser_click` → Sign in
4. Wait for `/dashboard`, then `browser_navigate` to target route

Rules:
- NEVER paste the password into output, reports, or other docs
- NEVER stage `.env.secrets` — `git check-ignore .env.secrets` must pass
- If `.env.secrets` absent → ask user once, then create it (don't prompt every run)

## Non-negotiable guardrails

1. **Browser-driven only** — you observe the running app via MCP `browser-1`. You do NOT read source code to guess workflows. DOM snapshots are ground truth.
2. **Test-or-it-didn't-happen** — a workflow is recorded ONLY if its generated Playwright test passes locally. No green test = no row. Silent failure is impossible.
3. **Never click destructive actions during exploration** — see §Tier classification. Those are T3 and get flagged, never exercised.
4. **Hard-delete cleanup for every mutation** — any test that creates a row must delete it and assert zero residue. Pattern = [create-quotation.spec.ts](../../tests/workflows/quotation/create-quotation.spec.ts).
5. **Every spec runs on desktop + mobile** — both `chromium-desktop` and `mobile-safari` projects. Rows need UI-D ✅ AND UI-M ✅ to be considered "captured".
6. **`data-testid` or `input[name=...]` selectors only** — no nth-child, no text-match beyond headings/toasts. Add testids to source if missing.

## Inputs

- **$ARGUMENTS** = module path as it appears in `public.modules.path` (e.g. `/clientprofiles`, `/jltt`, `/salary`).

If no argument given, ask the user which module.

## Process

### Step 1 — Verify prerequisites

1. Run these parallel:
   - `git status` — confirm clean working tree (no half-committed changes)
   - `curl -sI http://localhost:8080 | head -1` — confirm dev server running
   - Run Supabase MCP `SELECT name, path FROM public.modules WHERE path = '<arg>' AND is_active = true` — confirm module exists + is active
2. Check `/Volumes/JLQI` mount exists via `ls /Volumes/JLQI | head -1`. If the module flow touches NAS (quotations, claims, payslip, payroll, project), fail fast if unmounted.
3. Source `.env.secrets` (repo root) — confirm `AIGENT_PASSWORD` is set. See §Browser MCP auth above.

### Step 2 — Drive the browser

Use `mcp__browser-1__*` tools exclusively. Do NOT spawn subagents for this phase.

1. `browser_navigate` → `http://localhost:8080/login`
2. `browser_fill_form` → `$AIGENT_EMAIL` + `$AIGENT_PASSWORD` (sourced from `.env.secrets`)
3. `browser_click` Sign in
4. Wait for `/dashboard` URL
5. `browser_navigate` to `http://localhost:8080<module-path>`
6. `browser_wait_for` time=1 (let React Query settle)
7. `browser_snapshot` — get accessibility tree

### Step 3 — Enumerate interactive elements

From the snapshot, identify every element that's a candidate workflow trigger:

- **Links** (`<a>`): capture `href` and visible text.
- **Buttons**: capture visible text + any `aria-label`.
- **Form inputs**: capture name, type, placeholder.
- **Tabs / Accordion triggers**: capture panel names.
- **Table row actions**: per-row click handlers (often "View", "Edit", "History").

Record each as a candidate with: { element_type, label, testid?, href?, inside_form? }

#### App-shell skip list (MANDATORY — these are tested ONCE in the WF-App-NN series)

App-shell chrome appears on every module via the `AppSidebar` rail (≥ lg) / `AppHeaderMobileBar` (< lg). Testing it per-module multiplies the suite for zero extra coverage. **Skip** (case-insensitive label match; `^` means "starts with"):

| Label match | Source component | Covered by |
|---|---|---|
| `^Overview$`, `^Back to Dashboard$`, `^Back$`, any rail nav item | `AppSidebar` / `AppHeaderMobileBar` | WF-App-01 |
| `^Logout$`, `^Sign ?Out$`, account menu entries | `AppSidebarFooter` / `AppHeaderUserMenu` | WF-App-02 |
| `^View as user`, `^Impersonate`, `^Stop Impersonating` | `ViewAsSelector` / `ImpersonationBanner` | WF-App-03 |
| `^Previous$`, `^Next$`, numeric page buttons (`^\d+$`), page-size select | `Pagination` (`primitives/ui`) | WF-App-04 |
| Notification bell (icon-only, `aria-label` contains `notification`) | `NotificationsBell` | WF-App-05 |
| ⌘K palette trigger + its results | `CommandPalette` (`primitives/overlays`) | WF-App-01 (same navigation surface as the rail) |

> `DashboardHeader`, `AppHeader` and `AppHeaderDesktopBar` were deleted 2026-07-25 — if a selector or spec still names one, it is stale. See `docs/99-refactor/_system/DEPRECATIONS.md`.

**Rule**: if a candidate matches this table, emit a log line like `skipped: app-shell WF-App-01 (Back to Dashboard)` and move on — **do NOT** write a spec, **do NOT** add a row.

If a module renders a **custom** back/logout/pagination that is NOT the shared component (verify by checking the DOM's source component name or lack of the expected testid), treat it as an `❓ unexpected` candidate — add a row flagging it so we can decide whether to unify or capture specifically.

#### Manifest reconciliation (OPTIONAL — use when MODULE_INTENT_MANIFEST.md is available)

If [MODULE_INTENT_MANIFEST.md](../../docs/99-refactor/_system/ledgers/MODULE_INTENT_MANIFEST.md) exists and has entries for this module, cross-check before Step 4 classification:

1. **Every manifest line for this module** → must become a row (captured ✅ / T3 flagged ⚠️ / failed ❌). If a manifest line has no matching DOM candidate, emit `❌ missing — manifest expects "<label>" but not found in DOM` row.
2. **Every DOM candidate not in the skip list AND not on the manifest** → emit `❓ unexpected — "<label>" on page but not in manifest` row. Do not silently drop.
3. **Every DOM candidate matching a manifest line** → proceed to classification in Step 4.

If the manifest file doesn't exist or has no entries for the module, skip this block and proceed directly to Step 4 using DOM candidates only.

### Step 4 — Classify each candidate into T1 / T2 / T3

Use **attribute-based matching only**. Do NOT guess based on module context. Matching is case-insensitive.

| Tier | Match criteria | Action |
|---|---|---|
| **T1** (safe — exercise fully) | Link (`<a>` with `href`) · button with label matching `/^(view\|open\|see\|details\|history\|back\|search\|filter\|sort\|export\|download\|copy\|refresh\|help\|about)/` · tab triggers · navigation · pagination · collapsible toggles | Generate spec that clicks + asserts navigation/panel opens · verify URL change OR element appears · NO DB mutation expected |
| **T2** (form — fill, stop before submit) | `<form>` present OR submit button with label matching `/^(save\|create\|add\|submit\|update)/`. Exclude destructive labels. | Generate spec that fills fields + clicks save · UI+DB post-checks · hard-delete cleanup |
| **T3** (destructive — refuse) | Button label matching `/^(delete\|remove\|archive\|discard\|drop\|approve\|reject\|send\|publish\|cancel.*approval\|finalize\|close.*account)/` | Append row with `tier: T3 · needs_skill`, empty spec, overall ❌ — user picks up via `/write-workflow-test` |

If a candidate doesn't clearly match any tier, **skip it silently** — don't guess.

### Step 5 — Generate + run spec per T1/T2 candidate

**For each T1 candidate** (safe nav/view):

1. Assign WF-NNNN. Find next unused WF-NNNN ≥ 0200 (P1 range) in `docs/99-refactor/_system/ledgers/WORKFLOW_LEDGER.md` if it exists, otherwise track locally.
2. Slugify the module path (`/clientprofiles` → `clientprofiles`) + action (`/^View Client Details/` → `view-client-details`).
3. Write spec to `tests/workflows/<module-slug>/<action-slug>.spec.ts`:

```ts
// Template for T1 (safe nav/view) — UI only
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pom/LoginPage';
import { testUsers } from '../../fixtures/testUsers';

test.describe('WF-NNNN · <module> · <action label>', () => {
  test('navigates to <target> and renders expected content', async ({ page }) => {
    await new LoginPage(page).signIn(testUsers.admin.email, testUsers.admin.password);
    await page.waitForURL('**/dashboard', { timeout: 20_000 });

    await page.goto('<module-path>');
    // Trigger the action
    await page.<locator>.click();
    // Assert outcome (URL or element)
    <assert>
  });
});
```

4. Run it: `PLAYWRIGHT_BROWSERS_PATH=/Users/tanweijie/Library/Caches/ms-playwright npx playwright test <spec-path>`
5. **If 2/2 pass** (desktop + mobile) → record a row with ✅
6. **If any project fails** → delete the spec file, log the failure to `tests/_explore-failures/<module-slug>-<ts>.log`, move on. **No row.**

**For each T2 candidate** (form with mutation):

Much more careful. Template patterns off [create-quotation.spec.ts](../../tests/workflows/quotation/create-quotation.spec.ts).

1. BEFORE writing the spec, seed test data requirements:
   - Find what the form needs (required fields from DOM — `required` attribute, `aria-required`)
   - If dropdowns are present, Supabase-MCP-query for a row that satisfies constraints
2. Add `data-testid="<module>-<field-name>"` to source form elements (edit the React component)
3. Write spec with:
   - `beforeAll`: pre-clean residue via prefix `[test] WF-NNNN%`
   - Fill form with `[test] WF-NNNN <timestamp>` in the most-visible string field (usually title or name)
   - Save
   - UI: assert redirect or toast
   - DB: poll for created row via service-role client, check expected children
   - NAS/Gmail: only if module is known to touch them (see §Module→tool map below)
   - Hard-delete: `hardDelete<Module>ByPrefix('[test] WF-NNNN%')` + cascading side-effect cleanup
   - Assert zero residue
4. Run desktop + mobile. Same accept/reject rules as T1.

**For each T3 candidate**: append a row immediately:

```md
| WF-NNNN | <Action label> | <module-path> | T3 · needs_skill | — | — | ❌ | — | — | — | ❌ | — | — |
```

Claude doesn't generate a spec or test. `/write-workflow-test` covers these later.

### Step 6 — Update ledger + report

1. If `docs/99-refactor/_system/ledgers/WORKFLOW_LEDGER.md` exists, write all new rows under a **new "P1 autodiscovered" section** (not the P0 block). Otherwise, save a local `tests/_explore-results/<module-slug>-results.md` as notes.
2. If the ledger exists, update the Progress line at top: `N rows captured · N all-green · P0 unchanged · P1: <new>/<new> green · T3 flagged: <n>`.
3. Report to chat: `Module <path>: T1 captured=<n>, T2 captured=<n>, T3 flagged=<n>, failed-and-skipped=<n>, total session time=<s>s`.

## Module → tool map

Which evidence tools apply per module (for T2 templating):

| Module category | Tools |
|---|---|
| `/quotations`, `/quotationsettings` | UI + DB + NAS (folder) + Gmail (on send, not create) |
| `/claims`, `/payment-management`, `/invoices` | UI + DB + NAS (PDF) + Gmail (on send) |
| `/salary`, `/payslip`, `/ot-calculator` | UI + DB + NAS (payslip PDF) + Gmail (on send) |
| `/projectlist`, `/meetingprojects` | UI + DB + NAS (folder) |
| `/jltt`, `/generalworks`, `/supervisor*` | UI + DB + NAS (photo uploads) |
| `/workerlist`, `/staffmanagement`, `/peoplemanagement`, `/clientprofiles`, `/companylist` | UI + DB |
| `/email*`, `/comms`, `/hr/*` | UI + DB + Gmail |
| `/admin`, `/*-dashboard`, `/*-settings` | UI + DB |
| `/nasfoldertemplates`, `/nasoperations` | UI + DB + NAS |

If unsure, default to UI + DB only. NAS/Gmail can be added via `/write-workflow-test` later.

## Anti-patterns (kill on sight)

- ❌ Reading source code to infer workflows — you observe the DOM, not the code
- ❌ Recording a row without running the spec green
- ❌ Clicking any button whose label matches T3 regex — refuse, flag, move on
- ❌ Using `nth-child` or loose text matches in selectors — testid or `name=` only
- ❌ Running with `slowMo` enabled for exploration — it's a config-level setting; exploration specs inherit the default
- ❌ Touching the P0 block in the ledger — autodiscovered rows go to a P1 section
- ❌ **Scoping down "for tune run" / "too complex" / "representative subset"** — if a candidate matches T1 or T2 regex AND is on the manifest, you MUST capture it. Complexity is not a valid reason to defer; solve the dependency (seed fixtures, add testids, etc.) or log why with a `❌ failed` row.
- ❌ Testing app-shell chrome per module (Back to Dashboard, Logout, pagination Next/Prev) — these live in the skip list and are captured once as WF-App-NN. If you find a module with a custom chrome component, flag as `❓ unexpected`, don't capture it as a module-specific row.

## When to stop

After one module is processed, **report summary and STOP**. Review results before running another module. Chain to `/write-workflow-test` for any T3-flagged rows.

## Related

- Template reference spec: [create-quotation.spec.ts](../../tests/workflows/quotation/create-quotation.spec.ts)
- Template POM: [QuotationCreatePage.ts](../../tests/pom/QuotationCreatePage.ts)
- Supabase runner: [supabaseChecks.ts](../../tests/runners/supabaseChecks.ts)
- Quotation checks + cleanup: [quotationChecks.ts](../../tests/runners/quotationChecks.ts)
- NAS checks + cleanup: [nasChecks.ts](../../tests/runners/nasChecks.ts)
- Workflow spec tool: `/write-workflow-test` — use for T3-flagged rows and bespoke workflow specs
- Decision lock (never propose manual): [feedback_no_manual_walkthrough.md](/Users/tanweijie/.claude/projects/-Users-tanweijie-repo-AppBase-trench-trace-portal-app/memory/feedback_no_manual_walkthrough.md)
