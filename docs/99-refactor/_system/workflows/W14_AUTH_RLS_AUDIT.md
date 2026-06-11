# W14 — Auth + RLS audit

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-19 SGT (eod+15 — ledger reconciled post W15.02 Part A)
**Status**: 🟢 CLOSED 2026-04-18 (matrix shipped, X12 ✅ committed, watchdog baseline set, COMMENT ON POLICY applied to 20 permissive policies) · unblocks W15
**Priority**: 🔴 Critical

**Goal**: Verify the current auth + RLS state table-by-table, produce a "who can CRUD what" matrix, and decide the per-table policy strategy before any real policies get written.
**Tier**: Now · **Status**: 🟢 DONE 2026-04-18 (matrix shipped, X12 ✅ committed, watchdog baseline set, COMMENT ON POLICY applied to 20 permissive policies) · **Automation**: 🤖 auto (audit) + 👀 HITL (strategy decision)
**Blocked by**: ~~nothing~~ · **Blocks**: W15 (RLS rollout, now unblocked), W16 (needs auth spec)

## Live counts verified 2026-04-18 (supersedes earlier matrix estimate)

Direct SQL against `pg_policies` + `pg_class` on prod `your-project-ref`:

| Metric | Count | Note |
|---|---|---|
| Total `public.*` tables | 130 | (agent's matrix claimed 163 — stale count) |
| Tables with RLS enabled | 130 | 100% — no RLS-off tables |
| Tables with ≥1 policy | 130 | 100% |
| Permissive policies remaining | **2** | After intentional-keep exclusions (see breakdown below). W15.01 dropped `users.ai_ro_select` + `workers.ai_ro_select` (2026-04-18). W15.01b dropped `user_modules.ai_ro_select` + `role_modules.ai_ro_select` (2026-04-19). W15.03 closed as no-op 2026-04-19 (client domain was already capability-gated). **W15.04 dropped `projects.ai_ro_select` + `quotation_lifecycle_events.auth read lifecycle events` (2026-04-19 eod+14)**. **W15.05 dropped 12 ops/logs policies (2026-04-19 eod+14)**. Only W15.02 payroll tail remains. |
| RLS-disabled tables | **0** | Agent's matrix claimed 33 — **agent was wrong**. All tables have RLS enabled. |

**Implication for W15**: no "enable RLS first" step needed. Only 2 permissive policies remain after W15.01 + W15.01b + W15.03 (no-op) + W15.04 + W15.05 + W15.02 Part A — the W15.02 Part B payroll tightenings are all that stand between us and G4 `rls_restored`.

### 2 remaining holes — owner breakdown (verified 2026-04-19 eod+15 via live `pg_policies`)

Watchdog SQL returns **5 raw rows**. After subtracting **3 intentional keeps**, **2 real holes** remain, owned by:

| Owner | Count | Policies (table · policyname) |
|---|---|---|
| **W15.02 Part B** Payroll + Compensation | 2 | `worker_ot · ai_ro_select` (role: `ai_readonly`) · `worker_ot_status_log · ai_ro_select` (role: `ai_readonly`) |
| ~~**W15.02 Part A** HR Applications~~ | ~~1~~ 0 | ✅ **Closed 2026-04-19 (eod+15)** — `worker_applications · Authenticated can read worker_applications` (was treated as an intentional keep until Part A) replaced with `worker_applications_select_module_gated` (`has_module('HR Applications') OR is_admin()`). Migration `20260419_165635_w15_02_worker_applications_rls.sql`. |
| ~~**W15.04** Projects + Quotations~~ | ~~2~~ 0 | ✅ **Closed 2026-04-19** — `projects.ai_ro_select` dropped · `quotation_lifecycle_events.auth read lifecycle events` replaced with `quotation_lifecycle_events_select_approved` (`is_approved_user()`). Migration `20260419_160656_w15_04_projects_quotations_rls.sql`. |
| ~~**W15.05** Ops + Logs~~ | ~~12~~ 0 | ✅ **Closed 2026-04-19 (eod+14)** — 12 permissive policies dropped across `email_classifications` · `email_threads` · `modules` · `roles` · `services` · `site_form_pdf_templates` · `trial_trenches` · `trial_trench_services` · `trial_trench_status_log` · `whatsapp_threads` · `whatsapp_messages` · `whatsapp_participants`. 8 were DROP-only (real policies already in place); 4 got new capability-gated replacements in the same migration (`20260419_160554_w15_05_ops_logs_rls.sql`). No new capability slugs needed. |
| **Intentional keeps** (excluded) | 3 | `rls_capabilities · Authenticated users can read rls_capabilities` (public capability lookup) · `worker_applications · Service role can CRUD worker_applications` (HR Applications API write-path) · `quotation_lifecycle_events · service role writes lifecycle events` (service-role INSERT for email/agent lifecycle writes) |

**G4 gate math**: W15.02 Part B drops 2 → watchdog returns 0 real-hole rows → G4 `rls_restored` flag can fire. W15.01 ✅ · W15.02 Part A ✅ · W15.03 ✅ (no-op) · W15.04 ✅ · W15.05 ✅ already landed. Part B deferred to post-W17 (multi-role test-user fixtures needed to verify regressive tightenings don't silently break coordinator/supervisor/drafter flows).

## Why this exists

User's stated belief: "I removed all RLS". Verified state (2026-04-16): RLS is *enabled* on most tables but with **permissive** policies (`USING(true) WITH CHECK(true)`) — that's "RLS on but toothless", not "RLS off". Also:
- Migration `20260406_130000_rls_capabilities.sql` suggests a capability framework already exists
- Migration `20250912_113535_fix_critical_rls_security_vulnerabilities.sql` has 28 real policy creates (some tables *were* hardened)
- Doc [authentication/AUTHENTICATION_SYSTEM.md](../../../01-system-architecture/authentication/AUTHENTICATION_SYSTEM.md) says "security enforced at application level" — that's the documented stance, not a bug

So the task is: replace permissive with real, reusing the capability framework where it already exists. Before writing any real policies, we need the ground truth map. This card produces it.

## Scope

**In:**
- Audit every table in `public` schema — RLS on/off + each policy's USING / WITH CHECK expression
- Dissect existing `rls_capabilities` framework — what it does, what it covers, does it still work
- Produce `research/RLS_STATE_MATRIX.md` — table × role × CRUD matrix showing current effective permissions
- Rank HIGH-risk tables (payroll, salary, pay_slips, users, people, client_contacts) for earliest rollout in W15
- Decide policy strategy (capability-based vs role-based vs feature-based) — commits as X12
- Sketch the ESLint/lint rule to catch direct DB access bypassing RLS (feeds W07 primitives)
- Update `.claude/rules/rls-policy.md` with the agreed pattern going forward
- Document existing permissive policies as deliberate tech debt (header comment "TEMPORARY — replaced in W15")

**Out:**
- Writing non-permissive policies (that's W15)
- Changing auth provider (staying on Supabase Auth — see also rationale)
- 2FA (W16)
- Singpass (deferred out of refactor per user)

## Rationale for staying on Supabase Auth

| Concern | Verdict |
|---|---|
| Authentication (who are you?) | Supabase Auth is solid — no reason to leave |
| 2FA | Supabase Auth has MFA built in — W16 enables it, not a rebuild |
| Password reset | Done, works |
| Admin approval gate | Done, works |
| Overview of who-can-CRUD-what | Auto-generated from RLS policies once W14 matrix exists |
| Singpass (future) | Supabase Auth supports custom OAuth providers — plug in when business-registered |
| Custom providers cost | Clerk/Auth0/WorkOS = $$/month + weeks of migration + loses existing module system. Not justified. |

## Inputs / Outputs

| What | From | To |
|---|---|---|
| RLS state per table | live Supabase (`your-project-ref`) + migrations | `research/RLS_STATE_MATRIX.md` |
| Capability framework state | `20260406_130000_rls_capabilities.sql` + app code | same matrix doc |
| Strategy decision | this card | X12 in SYSTEM_OVERVIEW |
| Rule spec update | this card | `.claude/rules/rls-policy.md` |
| HIGH-risk ranking | this card | W15 card order |

## Dependencies on other cards

- S1 parallel — no blockers
- Blocks W15 (rollout can't start without matrix + strategy)
- Informs W07 — shared primitives must respect RLS client-side, not bypass it
- Informs W16 — MFA enrolment records themselves get real policies per strategy

## Open workflow questions

- **Q-W14-a** ✅ **Capability-based strategy confirmed** — user wants the output to be a live "who can CRUD what tables for what" matrix (exactly the RLS_STATE_MATRIX deliverable). Not over-complicating — that IS proper RLS. Rendered in `/refactor-dashboard` after W15 finishes so the view stays current.
- **Q-W14-b** ✅ HIGH-risk first: `salary`, `pay_slips`, `users`, `payroll_*` — then outward (projects → quotations → workers → logs/configs).
- **Q-W14-c** ✅ Yes — every role × forbidden-action combo becomes a Playwright test under W04 seatbelt (already in W04 scope).
- **Q-W14-d** ✅ **Three-layer tracking system (user-clarified 2026-04-18)**. User's point: a policy like `USING(true) WITH CHECK(true)` is **functionally identical to no RLS** — RLS on + permissive policy = still wide open. The risk is forgetting any of them during W15 rollout. Tag-with-comment alone isn't enough; we need a ledger + a watchdog query.

  **Layer 1 — Authoritative ledger**: `research/RLS_STATE_MATRIX.md` already lists every permissive policy + every RLS-off table (5 + 33 = 38 items). This is the master checklist for W15.

  **Layer 2 — In-migration comment** on every remaining permissive policy:
  ```sql
  COMMENT ON POLICY "Authenticated can CRUD <table>" ON public.<table>
    IS 'TEMPORARY PERMISSIVE — functionally no-RLS. Replaced by W15.## before G4 merge gate. DO NOT ADD MORE.';
  ```
  Future-Claude opening `pg_policies` sees the ledger entry and can't accidentally add another one.

  **Layer 3 — Watchdog SQL** (runs in W20 Claude cron + after every W15 sub-card merge):
  ```sql
  -- Detect any remaining permissive-no-op policy — should trend to 0 by G4
  SELECT schemaname, tablename, policyname, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual = 'true' OR qual IS NULL)
    AND (with_check = 'true' OR with_check IS NULL);

  -- Detect tables with RLS disabled entirely
  SELECT n.nspname, c.relname
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
  ```
  Both queries surfaced in `/refactor-dashboard` as a live counter (future dashboard Phase) so you see "permissive policies remaining: 5 → 4 → 3 → …" as W15 progresses. G4 merge gate requires both queries return 0 rows.

  **W15 sub-card requirement** (propagated into W15 card template): each W15.## PR description must list the exact policy names it removes (copied from the ledger). CI check (or manual review) validates the RLS_STATE_MATRIX ledger is decremented in the same commit.

## Done-when

- `research/RLS_STATE_MATRIX.md` verified against live DB (not just migrations)
- X12 strategy decision committed to SYSTEM_OVERVIEW
- HIGH-risk domains ranked with W15 sub-card order (W15.01, .02, …)
- `.claude/rules/rls-policy.md` updated with agreed pattern
- Sets DAG flag: **`auth_audited`**

## Related

- [authentication/CONTEXT.md](../../../01-system-architecture/authentication/CONTEXT.md) — current auth workspace
- [DATABASE_POLICY.md](../../../01-system-architecture/DATABASE_POLICY.md) — minimal-RLS stance (to be revised)
- [`.claude/rules/rls-policy.md`](../../../../.claude/rules/rls-policy.md) — rule being updated
- [W15_RLS_ROLLOUT.md](W15_RLS_ROLLOUT.md) — consumes this card's output
- [W16_MFA.md](W16_MFA.md) — parallel auth-track card
