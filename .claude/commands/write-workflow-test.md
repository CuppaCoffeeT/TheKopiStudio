# /write-workflow-test — Generate a Playwright test from a natural-language workflow description

**Usage**: `/write-workflow-test <description>` (or just `/write-workflow-test` and I'll ask).

Turns a short English description of a user workflow into a running Playwright spec with multi-tool evidence checks + hard-delete cleanup. Primarily used for:

- T3 flows that `/explore-module` refused (delete, approve, send email, publish)
- AI-agent-triggered flows that have no UI click path (WF-0019 email-drafted quotation)
- Multi-step flows that cross modules (e.g., create quotation → link to project → create claim)
- **AI-Server workflows** (Trigger=Email/Cron) — agent pipelines without a UI entry point, captured in the ledger's AI-Server section. These use `gmailSeed.ts` + `agentTick.ts` runners and assert on `quotation_lifecycle_events`. See WF-1000 → WF-1004.

## Non-negotiable guardrails

1. Desktop + mobile both required
2. Hard-delete cleanup + zero-residue assertion
3. `data-testid` or `input[name=...]` selectors only
4. Test data prefixed `[test] WF-NNNN` everywhere
5. **Every `test.describe` title MUST end with `@p0`** — CI (`.github/workflows/seatbelt.yml`) runs `npx playwright test --grep @p0`; untagged specs ship dead. Pattern: `test.describe('WF-NNNN · <short action> @p0', ...)`.

## Inputs

**$ARGUMENTS** — natural-language description. Examples:

- `/write-workflow-test delete a client profile: open /clientprofiles, click Delete on a test row, confirm`
- `/write-workflow-test send a quotation to client via email: approve WF-0012 output, click Send, verify Gmail arrival at admin@example.com`
- `/write-workflow-test create quotation via email agent: seed Gmail inbox with test quote-request email, wait for agent cron, verify quotations row appears with source=email_agent`

If missing or terse, ask the user to fill in:
- **Module path** (which section of the app?)
- **Actor role** (admin? coordinator? worker?)
- **Trigger** (UI click? email arrival? cron?)
- **Expected outcome** (what should change in DB/NAS/Gmail?)
- **Cleanup** (what needs to be deleted/undone?)

## Process

### Step 1 — Parse the description into a workflow spec

Produce a structured plan with these fields. Echo it to the user for confirmation **before writing code**:

```yaml
id: WF-NNNN                 # next available in ledger
title: <short name>
module: <path from public.modules>
actor: aigent (always, until non-admin test users exist)
tier: T3 · manual           # always T3 for this skill
trigger:
  kind: ui | email | cron | api
  steps: [<click|type|nav actions>]
evidence:
  ui: <assert after action>
  db:
    - table: <table>
      where: <filter>
      expect: <count / field>
  nas:   # optional
    - path: /volume1/<...>/<run-id>.pdf
      expect: exists
  gmail: # optional
    - search: in:inbox subject:"[test] WF-NNNN"
      expect: count >= 1
cleanup:
  db_delete: <sql or runner call>
  nas_delete: <path or none>
  gmail_delete: <search or none>
```

Wait for user confirmation before Step 2.

### Step 2 — Assign WF-ID + prep test data

1. Pick a WF-NNNN identifier for the new test (continue the numbering sequence visible in `tests/workflows/`).
2. If test data is needed, seed via Supabase MCP (for predictable test inputs). Use a `[test] WF-NNNN` prefix on any user-visible string so cleanup + `beforeAll` pre-clean can identify it.
3. If module form elements lack testids, add them to source. Name: `data-testid="<module-slug>-<field>-<action>"` (e.g., `client-profile-delete-btn`).

### Step 3 — Choose template

Match against existing references:

| Description pattern | Template |
|---|---|
| Pure UI click + assert URL/panel | [tests/workflows/auth/login-admin.spec.ts](../../tests/workflows/auth/login-admin.spec.ts) |
| Form create with DB + optional NAS | [tests/workflows/quotation/create-quotation.spec.ts](../../tests/workflows/quotation/create-quotation.spec.ts) |
| Destructive UI action (delete/archive) | WF-0012 minus NAS + reversed cleanup (restore or re-create baseline) |
| Email-triggered (AI agent flow) — **PATH A: real email via Playwright Gmail compose** (proven 2026-04-19 WF-1000) | Browser-MCP drives Gmail UI on a **non-@example.com sender** → Compose → `document.execCommand('insertText', ...)` to fill body → click Send → `launchctl kickstart gui/501/com.yourcompany.cron.inbox-router` → poll `email_threads` + `quotations`. See **§Path A recipe** below. Reference: WF-1000. |
| Cron-triggered (AI agent tick) | SSH wraps `launchctl kickstart gui/501/com.yourcompany.cron.quotation-lifecycle-agent` (launchd context — inherits GUI keychain, unlike bare SSH bash) + poll `quotation_lifecycle_events` + `quotations.notes_for_ai.lifecycle`. Reference: WF-1001 / WF-1004. |
| Multi-module chain | Compose multiple POMs; single test asserts end-state across tables |
| AI-Server P0 (Email + Cron + UI) | Combined pattern: Path A email seed → launchd kickstart inbox-router → launchd kickstart email-quotation → UI assertion (PendingChaseSendCard visible) → UI click (Send) → Gmail assertion + `[CHASE-SENT]` DB row. Reference: WF-1002 / WF-1003. |

### Step 4 — Write spec + required runners

1. Spec file: `tests/workflows/<module-slug>/<action-slug>.spec.ts`.
2. If a POM for the module doesn't exist, create minimal: `tests/pom/<Module>Page.ts` with just the methods this test needs.
3. If the module lacks a runner (DB check + hard-delete by prefix), create `tests/runners/<module>Checks.ts` mirroring `quotationChecks.ts`:
   - `fetch<Module>ByPrefix(prefix)` → evidence object
   - `hardDelete<Module>ByPrefix(prefix)` → deleted rows for downstream cleanup
   - `assertZeroResidueByPrefix(prefix)` → throws if anything left
4. Use existing `nasChecks.ts` for any NAS verification.
5. For Gmail: `tests/runners/gmailChecks.ts` (create if absent) — wraps `mcp__workspace-mcp__search_gmail_messages` + delete.

### Step 5 — Run + validate

1. `PLAYWRIGHT_BROWSERS_PATH=/Users/tanweijie/Library/Caches/ms-playwright npx playwright test <spec-path>`
2. Must pass on both `chromium-desktop` AND `mobile-safari` (unless flow is explicitly mobile-only or desktop-only — user flagged in description).
3. If red: diagnose + fix. Don't delete the spec — iterate until green, then commit.
4. Re-run 3x consecutively to catch flakiness. All must pass.

### Step 6 — Document the new spec

1. Add a brief entry to any relevant module `lessons.md` if a non-obvious pattern was needed (per lessons-logging.md rules).
2. Do NOT commit unless user explicitly asks.

### Step 7 — Report

Short chat summary:
```
✅ WF-NNNN <title> captured.
  Spec: tests/workflows/<module>/<action>.spec.ts
  Runners: (list new runners added)
  Source patches: (list new testids or other source changes)
  Desktop: passed (Xs) · Mobile: passed (Xs) · 3/3 consecutive runs
```

## Path A recipe — real email seed via browser-driven Gmail compose

**Use this when:** the workflow under test is triggered by an inbound email classified by the Mac Mini's `inbox-router` cron (RFQ, NDA, plan request, etc.). Proven end-to-end by WF-1000 on 2026-04-19.

**Why real email, not direct DB INSERT:**
- DB INSERT gives a synthetic `gmail_message_id` that's not in Gmail → downstream `SAVE_EMAIL_TO_PENDING` calls Gmail API → `400 Invalid id` → Claude agent errors out. You can't fake your way past the attachment fetch step.
- Real Gmail delivery means real `gmail_message_id` that the edge functions can actually fetch. Full classifier + W04 + NDA + lifecycle paths exercise cleanly.

**Why non-@example.com sender:** inbox-router's N5 filter rejects `from_address` matching `@example.com` as internal noise (per `EMAIL_RFQ_SIGNALS.md` NO-signal #4). Sender must be external (e.g. a personal Gmail logged into the browser MCP's `/u/1/` secondary profile). Send-As aliases on a @example.com account do NOT bypass this — the filter inspects `from_address` post-aliasing.

### Step-by-step

1. **Ensure browser MCP is logged into an external Gmail** on a secondary profile (e.g. `/mail/u/1/`). Cookie persists across sessions — one-time setup. Page title reveals which account is active.

2. **NAVIGATE to `https://mail.google.com/mail/u/<N>/#inbox`** and **CLICK the Compose button** from SNAPSHOT.

3. **FILL compose fields via EVALUATE** — Gmail compose is a React-like TUI where TYPE/FILL_FORM on SNAPSHOT refs time out. Use the `setNativeValue` + `execCommand('insertText')` pattern documented at **[AGENT_TOOLBOX/AGENT_BROWSER/AGENT_BROWSER.md §Gotchas — Gmail compose](../../../../../JLCode/AGENT_TOOLBOX/AGENT_BROWSER/AGENT_BROWSER.md#gotchas)**.
   - Subject **must** start with `[test] WF-NNNN` — for cleanup matching AND so the inbox never has polluting fake data if a run crashes mid-way.
   - Body must be ≥400 chars of realistic RFQ text (company name with `Pte Ltd` suffix, address, scope, contact) so the classifier + W04 company-resolution regex trip correctly.

4. **Verify send** — URL transitions from `#inbox?compose=new` → `#inbox` = success.

5. **Trigger inbox-router via launchd** (NOT via bare SSH — bash shell lacks GUI keychain, so `claude -p` in the classify subprocess fails with "Not logged in"):
   ```bash
   ssh youruser@your-mac-mini "launchctl kickstart -k gui/501/com.yourcompany.cron.inbox-router"
   ```
   Poll the log until the classification row appears — expect `effective_category=quotation_request` (or `request_nda`) with confidence at or above the floor.

6. **For email-triggered quotation creation:** kickstart `gui/501/com.yourcompany.cron.email-quotation` the same way. Wait until `pgrep -f email-quotation-precheck` exits, then probe the `quotations` table — a new row with `source='email'` and `client_company_id` matching the company in the email body should appear.

7. **For the lifecycle agent:** if you want to exercise the agent path, patch a test `quotation_number` on the new row to bypass the `AGENT_REQUIRES_QUOTATION_NUMBER` gate, then kickstart `gui/501/com.yourcompany.cron.quotation-lifecycle-agent`. Assert `notes_for_ai.lifecycle` + the corresponding `quotation_lifecycle_events` row.

8. **Cleanup** — **FK order matters** (threads reference quotations reference companies):
   - NULL `email_threads.classification_id` + `email_threads.quotation_id`
   - DELETE `email_classifications` + `email_messages` + `email_threads` rows
   - DELETE `quotations` rows (CASCADE removes line_items, lifecycle_events, follow_ups, etc.)
   - DELETE the `client_companies` row that was created for the fake sender
   - SSH remove `/Volumes/JLQI/01 Quotation/_pending/<folder_created>`
   - TRASH Gmail messages on both sender inbox AND admin@ inbox via workspace-mcp

9. **Re-probe residue** — `threads=0`, `quotations=0`, `companies=0`. If nonzero, the cleanup is buggy and must be fixed before marking the ledger row green.

### Path A gotchas (learned from WF-1000)

| Gotcha | Mitigation |
|---|---|
| TYPE on Gmail's To/Subject/Body refs times out | Use EVALUATE + `setNativeValue` pattern. See **[AGENT_BROWSER §Gotchas — Gmail compose](../../../../../JLCode/AGENT_TOOLBOX/AGENT_BROWSER/AGENT_BROWSER.md#gotchas)**. |
| SSH-fired scripts can't read GUI keychain → claude CLI returns "Not logged in" silently | **Always** kickstart via `launchctl`, never bash the script directly over SSH. Path label format: `gui/501/com.yourcompany.cron.<job>`. |
| `claude auth login --claudeai` has two flows: Path A (auto-approve via localhost callback) + Path B (displays code to paste into CLI). Path B isn't reliably automatable today. | See [AGENT_TOOLBOX/LAUNCH_AGENTS/AUTO_REAUTH.md §New claude.ai OAuth flow](../../../../../JLCode/AGENT_TOOLBOX/LAUNCH_AGENTS/AUTO_REAUTH.md). Manual recovery: VNC in, open Terminal, run `PATH=/Users/jlmac/.local/bin:$PATH claude auth login --claudeai`, click Authorize in Safari. |
| `classify_thread.py` used to silently fall back to `ai_category=general` on auth failure → fixed 2026-04-18 (Bug #1); now exits 2 loudly. | Don't re-introduce silent fallback on future subprocess calls. Regression: `tests/regression/INBOX_ROUTER_AUTH_FAIL_LOUD/`. |
| Bootstrap `set_lifecycle` previously skipped `log_transition` → no timeline event on the first state change. Fixed 2026-04-19 (Bug #7). | Assert `quotation_lifecycle_events` has a row for any bootstrap transition. |
| `email-quotation-precheck.sh` exits 0 even when the Claude agent's own run report says `⚠ Error N / ✅ Created 0` | Known Bug #5 (not yet fixed). Don't trust the cron's exit code alone — parse the agent's run-report Markdown for `Created` count. |

## Anti-patterns

- ❌ Writing spec before the user confirms the yaml plan (Step 1)
- ❌ Using `page.waitForTimeout(<number>)` — only `waitFor*` with explicit conditions
- ❌ Skipping mobile-safari because "it's a desktop flow" unless the user explicitly says so (AI-Server rows are desktop-only by design — no mobile UI involved)
- ❌ Cleanup that leaves residue — always re-assert zero via runner
- ❌ Hardcoding real client names / real quotation numbers — always `[test] WF-NNNN` prefix
- ❌ Direct DB INSERT into `email_threads` / `email_messages` as a seed shortcut — proved unworkable for WF-1000 (synthetic Gmail ID breaks `SAVE_EMAIL_TO_PENDING`). Use Path A real-email seed.
- ❌ SSH-triggering cron scripts directly (`ssh jlmac "bash /path/script.sh"`) — shell lacks GUI keychain, claude CLI subprocess fails. Use `launchctl kickstart gui/501/com.yourcompany.cron.<label>`.

## When to stop

After the spec is green, report and STOP. Don't auto-chain into another workflow — user invokes the skill per capture.

## Related

- Template: [create-quotation.spec.ts](../../tests/workflows/quotation/create-quotation.spec.ts)
- Autodiscovery: [explore-module.md](./explore-module.md)
