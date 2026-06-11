# W01 — Supabase baseline + staging substrate

**Goal**: Decide whether to run against branches or live-DB. **Resolved 2026-04-18**: **Path B (live-DB + Pro backups) now; deferred Path A to Week 5** after W09 modules rebuild the local-files ↔ prod parity.
**Tier**: Now · **Status**: 🟢 DONE (Path B closed 2026-04-18; Track C accepted in Lite form) · **Automation**: 👤 manual
**Blocked by**: ~~X4 decision~~ (resolved) · **Blocks**: W04, W09 (both now unblocked)

## Why this exists

Migration history was lost during a year of live-DB edits. Supabase branching failed twice with older AI. Without a testing substrate, every refactor PR risks prod. Two paths:
1. Fix branching (attempt #3) — clean baseline migration from `pg_dump --schema-only`, reset history, try again
2. Formalize live-DB editing — accept it, add weekly `pg_dump` cron to a `appbase-snapshot-YYYYWW` project for rollback

Either path ends with a `pre-refactor-baseline` git tag + a documented restore procedure.

## Scope

**In (revised by research — REFACTOR_BEST_PRACTICES §5):**
- 30-min spike using the canonical recovery path: `pg_dump --schema-only` archive → reset `schema_migrations` table → `supabase db pull` to generate baseline migration → adopt declarative `supabase/schemas/` + `db diff` going forward
- **One-time CLI exception** — this flow requires Supabase CLI; CLAUDE.md rule "never use CLI for DB changes" is relaxed *only* for this reset. Document the exception at the top of the baseline migration file.
- If spike fails: document live-DB protocol + weekly `pg_dump` cron (Mac Mini) to new snapshot project
- `pre-refactor-baseline` git tag on `main` — gates W05 drift detector
- Restore-test: take a snapshot, restore to a scratch Supabase project, verify
- Going forward: append-only column additions (keeps `db diff` clean)

**Out:**
- Rewriting existing migrations semantically
- Schema changes (those belong to per-module W09 cards)
- Data migrations

## Inputs / Outputs

| What | From | To |
|---|---|---|
| Current schema | live `your-project-ref` | `supabase/migrations/00000000_000000_baseline.sql` |
| Weekly snapshot | live | new Supabase project `appbase-snapshot-YYYYWW` |
| Rollback procedure | this card | `notes.md` here + linked from `SYSTEM_STATE.md` |

## Dependencies on other cards

- None upstream
- Downstream: W04 (test target), W09 (migrations land here)

## Open workflow questions

HITL verified answers below:

- **Q-W01-a** ✅ Fix branching or go straight to live-DB + snapshot? → **accepted default**: 30-min spike on branching attempt #3 first; decide next step based on outcome.
- **Q-W01-b** 🟡 *Rephrased after user feedback 2026-04-16.* Rollback snapshot source — Supabase built-in daily backups (Pro plan has these) OR custom `pg_dump` pipeline we add on top? → **revised default**: use Supabase's **built-in daily backups** as primary rollback. Only add a custom pipeline if (a) branching fix fails AND (b) built-in backups don't satisfy rollback. *What "snapshot trigger" meant originally*: if we built our own pipeline, we'd need something to fire `pg_dump` on a schedule (Mac Mini cron / Edge Function / GitHub Action). Since Supabase handles this natively, we skip the custom pipeline unless verification fails. *Verification during 2_DESIGN*: confirm retention (Pro plan = 7 days), test one restore to a scratch project, time RPO/RTO.
- **Q-W01-c** ✅ Snapshot retention (only if Q-W01-b lands on custom pipeline)? → **accepted default**: last 8 (~2 months).

## Done-when

**Path B (now — Week 1)**:
- Failed `testing` Supabase preview branch deleted ✅
- Path A (nuclear baseline reset) **deferred to Week 5** (S5 HARDEN), documented as a separate ticket `W01.02` scheduled after W09 modules rebuild local-files parity
- `supabase/CONTEXT.md` states "branching not in use, prod is the only DB"
- `CLAUDE.md` MCP section clarifies "no staging branch exists"
- `MIGRATION_GOVERNANCE_FRAMEWORK.md` gains a **"Why we don't use Supabase branching (2026-04-18)"** section with the drift numbers
- W04 Playwright card acknowledges "runs against prod with `is_test_data=true` — no staging"
- Track C (Supabase Pro built-in backup drill) completed — RPO/RTO recorded, restore verified to scratch project once
- X4 ✅ in SYSTEM_OVERVIEW with "Path B — live-DB + Pro daily backups; Path A deferred to Week 5"

**Path A (Week 5 — only after W09 modules done)**:
- Archive pre-baseline-reset migrations to `supabase/migrations_archive/pre_baseline_WEEK5/`
- Single baseline migration generated from live prod via `supabase db dump --linked --schema-only`
- `schema_migrations` truncated + re-seeded with baseline row (HITL gate)
- Supabase branch created successfully from the new baseline → status `ACTIVE_HEALTHY`
- `pre-refactor-baseline` git tag pushed
- Spike branch deleted after verification
- Ongoing drift prevention rule added to `.claude/rules/migrations.md`: "every `apply_migration` MCP call must also write the matching local `supabase/migrations/*.sql` file"

---

## 2_DESIGN — Runbook (rev 2026-04-18, after proper research)

**Status**: 🟡 Design drafted 2026-04-18. Review → accept → execute.

> ⚠️ First draft of this runbook was based on a wrong assumption that local files ≈ prod DB state. Research below shows they are not.

### Current state — verified via MCP + filesystem 2026-04-18

**Supabase side**:
- Project `your-project-ref` (YOUR-TEAM Backend, ap-southeast-1, Postgres 15.8.1, ACTIVE_HEALTHY)
- **GitHub integration already connected** — branches have `git_branch` values
- **2 existing branches, both `MIGRATIONS_FAILED`** (= attempts 1 & 2):
  - `main` branch (ref `your-project-ref`, git_branch `main`) — created 2025-08-22
  - `testing` branch (ref `wndjahujfgqufwxdukms`, git_branch `AItest`) — created 2026-04-14
- `mcp__supabase__list_migrations` on prod returns **371 rows** in `schema_migrations`

**Local side (`supabase/migrations/`)**: **365 `.sql` files**, classified:
- **318 well-formed** `YYYYMMDD_HHMMSS_description.sql`
- **21 broken 9-digit prefix** — e.g. `2025090903_050000_…` (9-digit date, not 8)
- **26 other malformed** — UUID suffixes, dash separators, pre-governance chaos
- `supabase/migrations_archive/` — 127 files preserved from 2025-09-07 reset
- `supabase/schemas/` — does not exist

**The actual gap (critical)**:
- Versions **in DB ∩ in local**: **only 7**
- Versions **in DB but not local**: **364** (migrations applied to prod that aren't in any local file, OR are under different filenames)
- Versions **in local but not DB**: **336** (local SQL files that prod has never seen)

→ **This is why branching fails.** Supabase branching replays `supabase/migrations/*.sql` on a blank DB (Clone → Pull → Health → Configure → **Migrate** → Seed → Deploy). Our local files don't represent what prod actually ran, so the replay hits errors (missing dependencies, wrong order from malformed-filename sort, duplicate table defs, etc.). No amount of retrying fixes the filename/state drift — we must change the source material.

**Supabase CLI**: v2.33.9 installed (v2.90.0 available — upgrade only if we go with Path A).

**2025-09-07 baseline reset history** (per `docs/06-operations/migrations/MIGRATION_SYSTEM_RECONSTRUCTION.md`):
- Previously consolidated 120 chaotic migrations → 1 baseline. That one-shot fix worked at the time. Since then, 370+ more migrations were added via MCP directly to prod, but the **local files drifted out of sync** again — largely because MCP `apply_migration` writes to prod's `schema_migrations` but does NOT necessarily create a matching local file (or the local naming drifted). This is the same class of problem, bigger scale.

### Strategy — two honest paths, user picks

**Path A — Nuclear baseline reset (attempt #3 done right)**. 90-min timebox, reversible via Pro backup.
Goal: make local files match DB by collapsing both to a single baseline migration, then testing branching on clean state.

**Path B — Declare branching dead, formalize live-DB workflow**. ~30 min. No prod changes.
Goal: stop bleeding time on branching, rely on Pro built-in daily backups + MCP-only discipline going forward.

**Decision criteria**:
- Pick **A** if you accept one more scheduled prod operation (truncate + re-seed `schema_migrations`) for the long-term win of a working staging branch — useful for W04 Playwright against a non-prod DB.
- Pick **B** if "ship > branching" dominates. Branching stays on the backlog; W04 Playwright runs against prod with a clearly-flagged test user (`is_test_data = true`).

Both paths also require Track C (**backup verification**, ~45 min) before merging G1. Backups are the rollback regardless of which path wins.

> ⚠️ If you want me to execute Path A iteratively right now, I need explicit sign-off on Step 3 (`TRUNCATE supabase_migrations.schema_migrations` on prod). Everything before Step 3 is non-destructive and I can run unattended.

---

### Path A — Nuclear baseline reset (iterative, 90-min timebox)

**One-time CLI exception** — CLAUDE.md `never use CLI for DB changes` is relaxed here. Document at top of the baseline migration file.

The idea: collapse both sides (365 local SQL files + 371 DB `schema_migrations` rows) into one file + one row. Then branching's Migrate step has only one thing to replay and it perfectly matches prod.

**Pre-flight (10 min, non-destructive)**:

1. Upgrade CLI: `brew upgrade supabase/tap/supabase` → `supabase --version` should be ≥ 2.90
2. `supabase login` (browser flow) + `supabase link --project-ref your-project-ref`
3. `git switch -c refactor/w01-supabase-baseline` (isolated spike branch — we'll delete if it fails)
4. `git status` must be clean first (stash or commit current work)
5. **Confirm Track C (backup drill) already succeeded** — we don't truncate without a verified rollback

**Step 1 — Dump live schema (5 min, non-destructive)**

```bash
# Uses DB password from Supabase Dashboard → Settings → Database → Session pooler
supabase db dump --linked --schema-only -f /tmp/appbase_baseline_20260418.sql
# Also dump roles + ACLs separately (some deploys need these)
supabase db dump --linked --role-only   -f /tmp/appbase_roles_20260418.sql

# Sanity check — should be hundreds of KB, not empty
wc -l /tmp/appbase_baseline_*.sql
grep -c 'CREATE TABLE' /tmp/appbase_baseline_20260418.sql   # expect ~100+
```

**Step 2 — Archive existing migrations (2 min, non-destructive locally)**

```bash
mkdir -p supabase/migrations_archive/pre_baseline_20260418
mv supabase/migrations/*.sql supabase/migrations_archive/pre_baseline_20260418/
ls supabase/migrations/ | wc -l                 # expect 0
ls supabase/migrations_archive/pre_baseline_20260418/ | wc -l  # expect 365
```

**Step 3 — ⚠️ HITL GATE: Reset prod `schema_migrations` (destructive, requires user ok)**

Run via `mcp__supabase__execute_sql` on `your-project-ref` ONLY after user signs off:

```sql
-- Backup first
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations_backup_20260418
  AS SELECT * FROM supabase_migrations.schema_migrations;

-- Clear so we can re-seed with just the baseline row
TRUNCATE supabase_migrations.schema_migrations;
```

Risk: if we botch Step 4, prod loses migration-history lineage (schema is untouched). Rollback = restore from `schema_migrations_backup_20260418` or from Pro daily backup.

**Step 4 — Put the baseline dump under `supabase/migrations/` (5 min)**

```bash
# Create the single baseline migration file, named to sort first
cp /tmp/appbase_baseline_20260418.sql \
   supabase/migrations/20260418000000_baseline.sql

# Prepend CLI-exception header manually (required per MIGRATION_GOVERNANCE_FRAMEWORK.md)
```

Re-seed the `schema_migrations` row so prod reflects the new baseline:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260418000000', 'baseline', ARRAY['-- baseline from pg_dump 2026-04-18']);
```

**Step 5 — Attempt #3 at creating a Supabase branch (iterative)**

First, **commit + push** the new baseline to the GitHub branch (Supabase branching pulls from GitHub):

```bash
git add supabase/migrations/ supabase/migrations_archive/pre_baseline_20260418/
git commit -m "chore(w01): supabase baseline reset attempt #3"
git push -u origin refactor/w01-supabase-baseline
```

Then create the Supabase branch — we'll use the `testing` one that already exists (reset it), not a new one:

```
# via mcp__supabase__reset_branch on branch_id 8d1223c4-1997-451d-8e28-b18b2322cc6d (testing / AItest)
# OR via mcp__supabase__create_branch with name = "w01-spike" and git_branch = "refactor/w01-supabase-baseline"
```

**Iteration loop** — if status returns `MIGRATIONS_FAILED`:
1. `mcp__supabase__get_logs(project_id=<branch_ref>, service='postgres')` to see the actual SQL error
2. Patch the baseline file for the specific error (most likely: missing extension, role that doesn't exist on fresh branch, or a pg-internal reference)
3. `git commit + push` to the same branch → Supabase auto-reruns
4. Repeat until status = `ACTIVE_HEALTHY` (or timebox hits)

**Cleanup (regardless of outcome)**:
- If success → delete the `w01-spike` Supabase branch + the GitHub branch, keep the baseline commit via PR merge to main
- If fail within timebox → roll back Step 3 from `schema_migrations_backup_20260418`, restore archived migrations, delete the git branch

**Success criteria**:
- Supabase branch status = `ACTIVE_HEALTHY`
- `mcp__supabase__list_migrations(branch_ref)` returns the same single baseline row
- `supabase db diff --linked` on main returns empty (branch schema = prod schema)

**Fail criteria (bail to Path B)**:
- 90-min timebox hit
- Can't get past the Migrate step after 3 iterative fixes
- Baseline dump produces errors that aren't isolated to one row/statement

---

### Path B — Declare branching dead, formalize live-DB workflow (~30 min, no prod changes)

Honest option. If "ship > branching" wins, stop trying and adopt what works.

**Step 1 — Document the decision (10 min)**:
- Update `supabase/CONTEXT.md`: add "Branching is not in use for this project — see W01 decision log" line
- Update `CLAUDE.md`: MCP-only DB discipline stays; add "no staging/branch exists, prod is the only DB"
- Update `SYSTEM_OVERVIEW.md`: X4 ✅ with "Path B — live-DB + Pro backups"

**Step 2 — Clean up the failed branches (5 min)**:
- Delete existing `main` branch (failed) + `testing` (failed) via `mcp__supabase__delete_branch`
- The branches page in Dashboard should be empty after this

**Step 3 — Update governance (15 min)**:
- `docs/06-operations/migrations/MIGRATION_GOVERNANCE_FRAMEWORK.md` — append section: "Why we don't use Supabase branching" with the 2026-04-18 drift numbers
- W04 Playwright card note: "runs against prod with `is_test_data=true` filter — no staging DB exists"

**Step 4 — Still do Track C** (backup drill is the rollback either way)

**Trade-off accepted**: lose branch-based preview/PR testing. Gain: no more attempts-to-fix-branching budget leaks. Revisit only when either (a) drift is repaired by W09 module-by-module migration rebuild, or (b) Supabase ships a dashboard feature to rebuild branch schema from prod snapshot (which docs hint at — "full schema dump" fallback).

---

### Track C — Supabase Pro built-in backup verification (~45 min, required for both paths)

Independent of A/B. Run same day.

**Step 1 — Confirm plan + retention (5 min)**
- Dashboard → Project → Settings → Add-ons → **Backups**
- Verify: Pro plan active, daily backup **retention = 7 days** (Pro default)
- Verify PITR status — Pro doesn't include PITR by default; daily snapshots only
- Screenshot + save to `docs/99-refactor/_system/research/SUPABASE_BACKUP_STATE_20260418.png`

**Step 2 — Pick restore target (5 min)**
- Create scratch Supabase project: `appbase-restore-drill-202616`
  - Same region as prod (ap-southeast-1) so timings reflect real restore
  - Smallest compute (drill only)
- Note its project ref + save password to 1Password (scratch, time-boxed)

**Step 3 — Restore most recent backup to scratch (time-measured, 20-30 min)**
- Dashboard → prod project → Backups → pick yesterday's backup → **Restore to new project** → select `appbase-restore-drill-202616`
- **Start stopwatch when you click Restore. Stop when scratch project is marked healthy + queryable.** This is **RTO**.
- Record **RPO** = timestamp-gap between (backup timestamp) and (incident simulation time, i.e. now).

**Step 4 — Integrity spot-checks on scratch (10 min)**

```sql
-- Via mcp__supabase__execute_sql with project_id = scratch-ref
-- 1. Table count sanity
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- 2. Row counts on 3 high-value tables (compare to prod approx)
SELECT 'quotations' AS t, count(*) FROM public.quotations
UNION ALL SELECT 'clients', count(*) FROM public.clients
UNION ALL SELECT 'projects', count(*) FROM public.projects;

-- 3. RLS still ON on a sensitive table
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'users';

-- 4. One known-good row lookup (replace with a real ID you remember)
SELECT id, company_name FROM public.clients LIMIT 1;
```

Compare to prod via MCP on `your-project-ref`. **All counts should match within ~24h staleness.**

**Step 5 — Document + teardown (5 min)**
- Record RPO + RTO in `docs/99-refactor/_system/research/SUPABASE_BACKUP_DRILL_20260418.md`:
  - RPO: _N hours_ (backup staleness at drill time)
  - RTO: _N minutes_ (clicked Restore → healthy scratch)
  - Integrity: pass / fail per check
- Delete the scratch project from Dashboard (or leave 24h, whichever is cheaper).

**Success criteria for Track C**:
- Restore completes without error
- Row-count drift within expected 24h window
- RPO ≤ 24h, RTO ≤ 60min (document actuals either way)
- Integrity checks all pass

**Fail criteria**:
- Restore fails OR produces broken schema → **escalate**. Open GitHub issue, block W04/W09.

---

### Outputs feeding SYSTEM_STATE

On completion, update:
- `SYSTEM_OVERVIEW.md` — X4 marked ✅ with the chosen primary path
- `SYSTEM_STATE.md` — W01 status 🔴 → 🟢, recent-changes entry
- `CLAUDE.md` / `supabase/CONTEXT.md` — add line: "baseline reset 2026-04-18, see W01"
- This card — add `## 4_TEST` + `## 5_DEPLOY` notes with actuals (RPO/RTO, any errors hit)

### HITL gates in this runbook

1. **Before Path A Step 3** (TRUNCATE schema_migrations) — user must eyeball dump + confirm
2. **Before Path A Step 5 commit push** — confirm baseline diff is clean
3. **After Track C** — user signs off on RPO/RTO being acceptable for prod risk tolerance

---

## 3_IMPLEMENT — Path B execution (2026-04-18)

User decision: **Path B now, deferred Path A to Week 5** (after W09 modules rebuild local-files ↔ prod parity).

### Actions completed

- [x] `testing` preview Supabase branch deleted (project_ref `wndjahujfgqufwxdukms`, git_branch `AItest`) via `mcp__supabase__delete_branch`
- [x] `main` Supabase branch **left in place** — it is `is_default: true` and represents prod. Its `MIGRATIONS_FAILED` status is cosmetic (the action-runner tried + failed, but the prod DB itself is `ACTIVE_HEALTHY`). No destructive action taken against it.
- [x] `supabase/CONTEXT.md` — added "Branching not in use" note + link back here
- [x] `CLAUDE.md` MCP section — clarified no staging branch exists
- [x] `docs/06-operations/migrations/MIGRATION_GOVERNANCE_FRAMEWORK.md` — appended "Why we don't use Supabase branching (2026-04-18)" with drift numbers (7 intersection / 364 DB-only / 336 local-only)
- [x] `SYSTEM_OVERVIEW.md` — X4 marked ✅ with "Path B — live-DB + Pro daily backups; Path A deferred to W5"
- [x] `SYSTEM_STATE.md` — W01 row updated to 🟡 IN PROGRESS (Track C backup drill pending)

### Manual step for user (not automatable via MCP)

- **Dashboard → Project Settings → Integrations → GitHub Integration**: either disable the integration OR toggle OFF "Automatic branching" so every PR doesn't auto-create a failing preview branch. Leaving the GitHub integration connected-but-inactive is fine.

### Still to do (before W01 → 🟢)

- **Track C — Supabase Pro backup drill** (this session or next): verify 7-day retention, restore a recent snapshot to a scratch project, record RPO/RTO. Run via the runbook's Track C section above.
- **Create W01.02 deferred-Path-A card** scheduled for Week 5 S5 HARDEN, blocked-by W09.

### Known limitation accepted by this choice

- No preview DB. W04 Playwright must run against prod with a `is_test_data=true` filter on every assertion. Documented in W04 card's open questions (flag this when touching W04 next).
- Drift between local `supabase/migrations/*.sql` and prod `schema_migrations` will keep growing until Path A runs. This is the cost we accept in exchange for not blocking the refactor on branching.

---

## 4_TEST — Track C Lite (2026-04-18)

**Full Track C not run.** Findings that made the call:

- Prod DB size: **561 MB** (verified via `pg_database_size`) — well under the 15 GB threshold for physical backups
- Without physical backups, the "Clone Project / Restore to new project" feature is **not available**
- Only way to get physical backups: enable **PITR add-on = +$100/mo**, or add a read replica (+compute). Neither justified for a rollback drill
- Creating a scratch Supabase project for logical-backup restore drill costs **$10/mo** and the actual restore flow is manual `psql` into the scratch DB — not a real RTO measurement for prod

### Track C Lite — accepted

- **Backup type in use**: Logical (daily `pg_dumpall`, zipped, Pro plan default)
- **Retention**: 7 days (Pro)
- **Where to access**: Dashboard → Database → Backups → Scheduled Backups (downloadable `.sql.gz`)
- **RPO**: 24h (accepted)
- **RTO**: UNTESTED (accepted risk — in real disaster, downtime = time to `psql -f backup.sql` into a replacement project, plus Storage rebuild since backups don't include Storage objects)
- **Rollback posture**: Supabase support + downloadable logical backup. Good enough for solo-dev "ship > perfection" stance.
- **Risk flags**:
  - `search_path` issues during logical restore (per docs — use schema-qualified names)
  - Custom role passwords not in backup (needs manual reset post-restore)
  - Storage objects not in DB backup (separate concern)

### Acceptance

- User acknowledges above risk profile as of 2026-04-18
- **Upgrade trigger** (revisit these numbers): if prod DB size crosses 15 GB, physical backups auto-enable and Track C can re-run with the Clone Project feature for free; also revisit during Path A in Week 5 if we want PITR.

---

## 5_DEPLOY — W01 closed 2026-04-18

### Shipped

- [x] X4 resolved → Path B locked in (live-DB + Supabase Pro daily logical backups)
- [x] X10 deferred to Week 5 alongside Path A
- [x] Failed `testing` Supabase preview branch deleted via `mcp__supabase__delete_branch`
- [x] `supabase/CONTEXT.md` annotated: "Branching NOT in use — prod is the only DB. See W01."
- [x] `CLAUDE.md` MCP section annotated with same
- [x] `docs/06-operations/migrations/MIGRATION_GOVERNANCE_FRAMEWORK.md` appended "Why we don't use Supabase branching (2026-04-18)" with drift numbers
- [x] `SYSTEM_OVERVIEW.md` backlog + X-decisions table updated
- [x] `SYSTEM_STATE.md` backlog + blockers + recent-changes updated
- [x] Project memory at `~/.claude/projects/.../memory/project_appbase_refactor_2026q2.md` updated
- [x] Track C Lite findings documented above — RPO=24h, RTO=untested, risk accepted

### NOT shipped (intentionally deferred)

- **Path A (nuclear baseline reset)** → Week 5 as `W01.02` card, blocked-by W09
- **`pre-refactor-baseline` git tag** → moves to W05 (drift detector tags baseline once module parity is restored)
- **Track C Full restore drill** → re-evaluate after DB > 15 GB OR when we next do a major schema op
- **`.claude/rules/migrations.md` drift-prevention rule** ("every `apply_migration` MCP call must also write the matching local `.sql` file") → will author during Path A prep in Week 5

### Manual user step still pending

- **Dashboard → Project Settings → Integrations → GitHub Integration**: toggle OFF "Automatic branching" so PRs don't auto-create failing preview branches. Not blocking any downstream card; cosmetic cleanup.

### Database changes made in this session

- `DELETE` on Supabase branch `8d1223c4-1997-451d-8e28-b18b2322cc6d` (testing/AItest) → this removed the preview project `wndjahujfgqufwxdukms` (a separate DB, not prod)
- **Zero changes to prod DB** (`your-project-ref`). No migrations applied, no schema changes, no row mutations. Read-only queries (`pg_database_size`, advisors) only.
