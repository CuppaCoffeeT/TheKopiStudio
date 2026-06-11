# W03 + W04 — Execution Protocol (multi-tool evidence harness)

**Created**: 2026-04-18 SGT
**Last Updated**: 2026-04-18 SGT — revised for multi-tool evidence + tiered autodiscovery + 9-phase plan
**Status**: 🔵 Planning — locked spec, Phase 0 complete
**Priority**: 🔴 Critical
**Owns**: how the W03 workflow capture + W04 multi-tool verification track runs as one paired pipeline. Phases also consumed by W11.02 (Modules tab) + W22 (CI gates).

## Why this exists

Every verification-heavy card this quarter hit the same failure mode: dispatch agent → agent keyword-scans → confident-wrong output → user catches late. W06 (8/8 wrong DB columns), W14 (33 phantom RLS-off tables), W12 (11× under-count), W18 (11/25 over-archived).

**Multi-tool evidence capture breaks this pattern.** A workflow is only "captured" when every downstream system it touches confirms the action happened. The running app + live DB + actual NAS + real Gmail are the sources of truth — not an agent's keyword reading of code.

## The principle

> **Workflow captured ↔ every post-action check across every tool is green.**
> No single check is sufficient. The UI turning green without the NAS file existing = incomplete workflow.

A ledger row is ✅ only when:
1. Playwright spec exists + passes locally
2. Every declared post-action check returns expected evidence
3. User has signed off on the click-by-click steps
4. CI gate passes on push

Miss any → row stays ❌ on that column.

## Multi-tool evidence sources

| Tool | Verifies | MCP/bridge |
|---|---|---|
| **Playwright** | UI clicks, form submits, renders, redirects, toasts | `npx playwright test` |
| **Supabase MCP** | DB rows written/read, audit logs, RLS behavior | `mcp__supabase__execute_sql` |
| **Google Workspace MCP** | Gmail drafts/sends, Drive files, Sheets data | `mcp__workspace-mcp__*` |
| **Synology NAS** | File exists at NAS path, correct size/contents | SSH `youruser@your-mac-mini` → `ls /volume1/...` or Synology REST API |
| **ghost-os** | macOS desktop app interactions (Finder, Numbers, accounting app) | `mcp__ghost-os__*` |
| **Xero / external** | Invoice sync, payment sync | optional, per workflow |

Most workflows use 2-3 tools. A quotation create touches UI + DB + NAS + Gmail = 4 tools. A simple login = UI + DB = 2 tools.

## Per-workflow data model

Every captured workflow in `WORKFLOW_INVENTORY.md`:

```md
### WF-0012 · Create quotation (P0)

- **Actor**: admin, sales-coordinator
- **Module**: Quotation Management (public.modules path `/quotations`)
- **Entry route**: `/quotations/new`
- **Tier**: T3 (user-described) | T2 (agent-drafted, form-up-to-submit) | T1 (agent-drafted, safe)
- **Preconditions**: logged in, at least one client exists

- **Steps (Playwright)**:
  1. Click `[data-testid="quotation-new-btn"]`
  2. Select client from `[data-testid="client-select"]` (choose first)
  3. Fill `[data-testid="quotation-title"]` with `[test] WF-0012 Quotation`
  4. Add line item via `[data-testid="add-line-item"]`, qty=1, price=100
  5. Click `[data-testid="save-quotation"]`

- **UI expected**: redirect to `/quotations/:id`, toast "Quotation created", row visible in list

- **Post-action evidence** (all must pass):
  - **[Supabase]** `SELECT COUNT(*) FROM quotations WHERE title LIKE '[test] WF-0012%'` → 1
  - **[Supabase]** `SELECT COUNT(*) FROM quotation_line_items WHERE quotation_id = :id` → ≥1
  - **[Supabase]** `SELECT COUNT(*) FROM quotation_audit_log WHERE quotation_id = :id AND action = 'create'` → 1
  - **[NAS]** `ssh jlmac ls /volume1/projects/[test]/quotations/WF-0012.pdf` → file exists
  - **[Gmail]** `search_gmail_messages in:drafts subject:"[test] WF-0012"` → ≥1 draft

- **Cleanup (afterAll)**:
  - **[Supabase]** `DELETE FROM quotations WHERE title LIKE '[test] WF-0012%'` (cascades to line_items + audit_log)
  - **[NAS]** `ssh jlmac rm /volume1/projects/[test]/quotations/WF-0012.pdf`
  - **[Gmail]** delete drafts matching `subject:"[test] WF-0012"`

- **Spec file**: [tests/workflows/quotation/create-quotation.spec.ts](../../../../tests/workflows/quotation/create-quotation.spec.ts)
- **Ledger row**: WF-0012
```

## The ledger

Single source of truth for progress: `_system/ledgers/WORKFLOW_LEDGER.md`

```md
# Workflow Ledger (W03 + W04)

**Progress**: N / 200 captured · N / 200 all-green · P0: N / 18 green
**Last updated**: YYYY-MM-DD

| ID | Workflow | Module | Tier | UI | DB | NAS | Gmail | Desktop | Overall | Spec | Last run |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WF-0001 | Login (admin) | Auth | P0 | ❌ | ❌ | — | — | — | ❌ | — | — |
| WF-0012 | Create quotation | /quotations | P0 | ❌ | ❌ | ❌ | ❌ | — | ❌ | — | — |
```

Per-tool columns show evidence status. `—` = tool not applicable for this workflow. `❌` = failing or not checked yet. `✅` = last run produced expected evidence.

**Ledger-or-it-didn't-happen rule**: a workflow has not been "captured" until its ledger row exists and all applicable tool columns are ✅.

## Tiered autodiscovery (T1/T2/T3)

Manual capture of 200 workflows is untenable. Tiered approach:

| Tier | What agent does | Safety | User involvement |
|---|---|---|---|
| **T1 — Safe read/nav flows** (list → detail → back, filter, search, view-only) | Drives browser, records clicks, writes full spec + post-checks, runs it | Zero state change | Batch-approve 20+ at a time |
| **T2 — Forms with mutation** (create/edit) | Fills form, records fields + testids, **stops before final Submit**. Writes spec up to mutation. | Agent doesn't execute the mutation. User fills in last step. | Per-workflow 30-sec check |
| **T3 — Destructive / multi-step** (delete, approve-to-client, send-email, payment trigger, cross-module chains, mobile flows) | Agent refuses to auto-capture. Flags for HITL. | Manual only | User describes walkthrough |

Expected distribution across ~200 workflows:
- T1: ~100 (50%) — auto
- T2: ~70 (35%) — auto-drafted, user confirms
- T3: ~30 (15%) — manual

**Safety rails for auto-discovery**:
- Test user `[test-admin]` with scoped permissions; no production data writes
- Every created row prefixed `[test] WF-NNNN` + `is_test_data=true` (W01 decision)
- Agent MUST NEVER click: delete buttons, send-email/WhatsApp/SMS, payment/Xero actions, approve-to-client, production workflow triggers
- Any state mutation = screenshot before + after, log to ledger
- Unknown dialog/confirm → STOP, append to T3 queue
- Cleanup runs after every exploration session; leftover `[test]` rows alert

## Execution plan (revised 2026-04-18 — simplified from 9 phases to 5)

> **Revision rationale**: original plan had Phase 5-6 autodiscovery (agent crawls modules, drafts specs). User observation: eyeballing agent-crawler drafts costs the same time as walking modules with me live — and live walkthrough catches flows the crawler misses (delete buttons, approve chains, mobile-only). So Phase 5-6 dropped. Phase 3 absorbs autodiscovery scope by being a user+Claude paired walkthrough. Phase 7 becomes T3 edges via skill.

### Phase 0 — Lock spec (2026-04-18 ✅)

- Protocol (this doc) locked with multi-tool + tiered framing
- Empty `WORKFLOW_LEDGER.md` with 18 P0 rows pre-populated
- New cards W11.02 + W22 registered
- **Exit**: system aware of what's being built. Zero code.

### Phase 1 — WF-0001 Login end-to-end (2026-04-18 ✅)

- Installed Playwright + config (headed local with 800ms slowMo; headless CI)
- `tests/workflows/auth/login-admin.spec.ts` — UI + DB post-check
- Ledger WF-0001 → UI-D ✅ UI-M ✅ DB ✅
- **Side deliverable**: WF-9000 Route smoke (50 modules × 2 projects, all green)
- **Exit achieved**: 1/18 P0 green + 1/1 Smoke green. Harness supports UI + DB.

### Phase 2 — WF-0012 + WF-0013 Quotation full lifecycle (in progress)

**Compound capture — create + send in one session to exercise all 5 tools:**

- **WF-0012 Create quotation (draft)**: fill form with line items, optional NAS folder checkbox, save. Verify: DB (quotations + quotation_line_items + audit_log), NAS (folder created), UI (redirect + toast).
- **WF-0013 Send quotation email**: click Send → PDF generated → uploaded to NAS folder → Resend API sends email. Verify: NAS (PDF file present), Gmail MCP (email arrived at `admin@example.com`).
- **Hard-delete cleanup** across both workflows: DB rows (cascade), NAS folder + PDF, Gmail test-inbox email. Re-query to assert zero residue.
- Run on desktop + mobile.
- **Exit**: 3/18 P0 green. Harness supports UI + DB + NAS + Gmail. Template for `/write-workflow-test` skill is complete.

### Phase 3 — (skipped — rolled into Phases 5+6)

Originally "paired walkthrough with user"; **rejected** by user 2026-04-18 as not scaling to 200 workflows. Autodiscovery restored (below).

### Phase 5 — Build `/explore-module` + `/write-workflow-test` skills (1 session)

Two slash commands that automate Phase 3:

**`/explore-module <module-path>`** — discovers + tests ONE module:
- Logs in as aigent via MCP browser (browser-1)
- Navigates to module path
- Enumerates interactive DOM elements via accessibility snapshot
- **Tier classification per element** (no guessing — by attribute + role):
  - T1 safe: `<a>`, buttons with `aria-label` matching View/Search/Filter/Sort/Navigate
  - T2 form: `<form>` and form submit buttons (fill + record, STOP before submit)
  - T3 destructive: buttons matching Delete/Approve/Send/Archive/Publish (refuse; flag for skill)
- For T1+T2: generates spec from WF-0001/WF-0012 template + runs it + keeps only passing rows
- Appends passing rows to WORKFLOW_LEDGER.md with evidence file link
- Flags T3 rows as `tier: T3, status: needs_skill`

**`/write-workflow-test <description>`** — T3 fallback for rare flows:
- User types natural-language description
- Skill generates spec using WF-0012 template
- Runs it, flips ledger on green

- **Tune on**: Client Profiles module first (~5 workflows, simpler than Quotations)
- **Exit**: skill produces <10% bad-draft rate on tune module. Prompt ready for loop.

### Phase 6 — Overnight autodiscovery loop (2-3 days wall clock)

- `/explore-all-modules` orchestrator — wraps `/explore-module` in a ScheduleWakeup loop
- Iterates every active module in `public.modules` (~50)
- Each module processed → ledger updated → next module scheduled
- User reviews in Modules tab after batches of 10-20 rows land
- Each passing row already has a running test behind it; review = approve/reject
- T3 rows accumulate for post-Phase-6 skill pass
- **Exit**: ~150-180 rows in ledger, 80%+ of estimated total workflow surface. T3 queue populated.

### Phase 7 — T3 skill pass (1 session)

- User invokes `/write-workflow-test` for each T3 flow flagged by Phase 6
- ~30 rows expected: delete chains, approve-to-client, send email, AI-agent-triggered flows (WF-0019)
- **Exit**: full ledger. Every workflow has evidence.

### Phase 8 — CI gates wired (W22, 1 session)

- Husky pre-commit: `tsc` + ESLint staged (~30s)
- Husky pre-push: full P0 suite (~5-8 min)
- GH Actions on push: full suite (~20-30 min)
- Telegram alerts on red (optional, W20 territory)
- **Exit**: seatbelt enforced. Red push blocked at laptop.

### Plan history — do not revisit (decision locked 2026-04-18)

- Original plan: 9 phases with autodiscovery (Phase 5-6)
- 2026-04-18 AM: Claude proposed dropping Phase 5-6 in favor of paired walkthrough. User approved tentatively.
- 2026-04-18 PM: User **reversed** — "not going to walk through 200 workflows; fully automated". Autodiscovery restored as the only scale path.

**Locked principle**: Phase 3 as paired walkthrough is **rejected**. Automation via `/explore-module` (browser-driven, not code-scanning) + skill fallback for T3 is the only acceptable approach. Future sessions must not re-propose manual walkthrough.

**Why browser-driven discovery is reliable** (unlike the keyword-scanning failures in W06/W14/W18): the agent observes the *running app* via MCP browser, not *source code*. DOM snapshots are ground truth. A workflow only lands in the ledger if the generated Playwright test actually passes → no fake claims possible.

## Guardrails for Playwright specs

Non-negotiable:

1. **`data-testid` selectors only** — no `.btn-primary`, no `nth-child`, no text-match for non-heading assertions. App gets test IDs added as part of capture if missing.
2. **No arbitrary waits** — no `page.waitForTimeout(2000)`. Only `waitForSelector`, `waitForURL`, `waitForResponse`.
3. **Deterministic fixtures** — every row prefixed `[test] WF-NNNN`. Cleanup in `afterAll` via all applicable MCPs.
4. **One workflow per spec file** — no bundling create+edit+delete.
5. **Idempotent preconditions** — `beforeEach` ensures sane world.
6. **Test ID naming**: `data-testid="<domain>-<element>-<action>"` (matches URL standard).
7. **Post-checks use MCP, not spec-embedded HTTP** — Supabase/Gmail/NAS verification runs via the runner, not inside Playwright, so evidence is first-class in the ledger.

## P0 workflow list (G1 gate)

18 pre-populated ledger rows. User validates + reorders before Phase 1.

| # | WF-ID | Workflow | Module |
|---|---|---|---|
| 1 | WF-0001 | Login (admin) | Auth |
| 2 | WF-0002 | Login (coordinator) | Auth |
| 3 | WF-0003 | Login (worker mobile) | Auth |
| 4 | WF-0004 | Create client | /clientprofiles |
| 5 | WF-0012 | Create quotation (draft) | /quotations |
| 6 | WF-0013 | Approve quotation | /quotations |
| 7 | WF-0014 | Link quotation to project | /quotations |
| 8 | WF-0020 | Create project | /projectlist |
| 9 | WF-0030 | Submit work entry (trial trench) | /jltt |
| 10 | WF-0031 | Submit work entry (general works) | /generalworks |
| 11 | WF-0040 | Submit OT hours | /ot-calculator |
| 12 | WF-0041 | Run monthly payroll | /salary |
| 13 | WF-0042 | Generate payslip PDF | /payslip |
| 14 | WF-0050 | Create progress claim | /claims |
| 15 | WF-0051 | Record payment | /payment-management |
| 16 | WF-0060 | Submit NCE | /nce-dashboard |
| 17 | WF-0099 | **Cache-staleness** — quotation edit→back | /quotations (W21 gate) |
| 18 | WF-0100 | **Cache-staleness** — project edit→back | /projectlist (W21 gate) |

## CI wiring (delivered by W22)

- **Runner**: GitHub Actions, push-triggered (not PR — user pushes direct to main per feedback)
- **Test target**: live prod DB, isolation via `is_test_data=true` filter + `[test]` row prefix (W01 decision)
- **Auth**: `storageState.json` pre-seeded for admin + coordinator + worker test users
- **Parallelism**: Playwright auto-parallel; post-checks serial per workflow
- **Block**: Husky pre-push locally blocks red before push leaves laptop; GH Actions post-push alerts if anything slips
- **Nightly full suite**: Mac Mini cron (W20)

## Session cadence

One session = one workflow fully captured (Phase 1-3) OR one batch of drafts reviewed (Phase 6).

**Expected throughput**:
- Phase 1: 1 workflow / session (harness setup)
- Phase 2-3: 2-4 workflows / session (harness reused)
- Phase 6: 20-30 draft reviews / session

## What this does NOT do

- **Does not test every screen.** P0 covers critical; edge cases are P1/P2, added incrementally.
- **Does not check visual regression.** Pixel diffs separate (Percy/Chromatic).
- **Does not catch pure-UI color bugs without behavior.** If button renders wrong color but still saves, test passes.
- **Does not replace manual QA.** Regression safety net, not completeness proof.
- **Does not test external APIs directly.** Xero sync etc. only via their DB/Gmail side effects.

## Anti-patterns (from this quarter's record)

- ❌ Dispatching agent to "discover workflows by reading code" — agent hallucinates flows that don't exist
- ❌ Single-tool evidence ("Playwright green = done") — misses DB/NAS/Gmail failures
- ❌ Writing specs before walking through app — describes imagined behavior
- ❌ Allowing `waitForTimeout` to stabilize flaky tests — hides race conditions
- ❌ Bundling multiple flows per spec — breaks one-workflow-one-ledger-row
- ❌ Marking ledger row ✅ before CI green — "hope for the best" pattern from W18

## How this links to the rest of the system

```
W01 baseline ──────────────▶ W04 test target (live DB + is_test_data)
                             │
W11 dashboard ──▶ W11.02 Modules tab ◀─── reads WORKFLOW_LEDGER
                             │
W03 inventory ──────────┬───▶ WORKFLOW_LEDGER.md  ◀── feeds W11.02, W22, W20
                        │
W04 multi-tool harness ─┘    │
                             │
W22 CI gates ────────────────┤  (blocks every push when red)
                             │
W21 cache fix ───────────────┤  (WF-0099, WF-0100 verify its fix)
                             │
W05 drift detector ──────────▶ W11.02 Modules tab compliance pills
                             │
W09 per-module migration ────┤  (each migration gated by module's P0 green)
                             │
W14/W15 RLS rollout ─────────┤  (RLS changes verified by workflow tests)
                             │
W20 cron watchdog ───────────▶ runs full ledger nightly, alerts on red
```

**The ledger is the central spine.** Every verification-heavy card feeds rows into it or reads rows from it.

## Done-when (joint)

W03 🟢 when:
- `WORKFLOW_INVENTORY.md` has all 18 P0 entries + stubs for non-P0
- Ledger reflects reality
- Non-P0 captured incrementally

W04 🟢 when:
- `playwright.config.ts` + `storageState.json` + multi-tool post-check runner scaffolded
- All 18 P0 specs pass locally + in CI (if wired)
- Cache-staleness specs green (WF-0099, WF-0100) — W21 gate satisfied
- One full green CI run documented in ledger header

Both flags = `seatbelt_live` DAG flag. Unblocks every W09 migration.

## Related

- [W03_WORKFLOW_INVENTORY.md](W03_WORKFLOW_INVENTORY.md) — capture card
- [W04_PLAYWRIGHT_SEATBELT.md](W04_PLAYWRIGHT_SEATBELT.md) — harness card
- [W11.02_MODULES_DASHBOARD_TAB.md](W11.02_MODULES_DASHBOARD_TAB.md) — visual progress tracker
- [W22_CI_GATES.md](W22_CI_GATES.md) — Husky + GH Actions wiring
- [W21_REACT_QUERY_CACHE_FIX.md](W21_REACT_QUERY_CACHE_FIX.md) — cache-staleness test requirement
- [W01_SUPABASE_BASELINE.md](W01_SUPABASE_BASELINE.md) — test target decision
- [WORKFLOW_LEDGER.md](../ledgers/WORKFLOW_LEDGER.md) — live progress
- `.claude/rules/query-compliance.md` — test data seeding rules
