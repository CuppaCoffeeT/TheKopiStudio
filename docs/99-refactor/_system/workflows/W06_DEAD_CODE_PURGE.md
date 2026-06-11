# W06 — Dead code purge

**Goal**: Remove confirmed-dead code (openclaw agent, old email inbox), triage every orphan surfaced by W02, **and** audit every DB table column-by-column (user scope-add: keep/drop/refactor per column).
**Tier**: Now · **Status**: 🟢 DONE 2026-04-18 (code side) — 68 files removed, ~18,870 LOC gone, tsc clean. DB column side parked: audit agent produced 8-for-8 false positives, zero signal — column cleanup rolled into W09 per-module migration. · **Automation**: hybrid
**Blocked by**: ~~W02~~ ✅ · **Blocks**: nothing (cheap wins)

## Why this exists

Dead code makes the refactor surface bigger than it needs to be. Two confirmed-dead systems per user: **openclaw agent** (replaced), **old email inbox** (replaced by new claude agent). W02 will surface more.

## Scope

**In:**
- Delete openclaw-agent code + all references — archive to branch `archive/openclaw-agent`
- Delete old email inbox code — archive to branch `archive/old-email-inbox`
- Delete 5 backup files cluttering `src/pages/` (surfaced in REPO_AUDIT §7)
- Run **knip** on remaining tree — review each orphan with user
- Drop confirmed-dead Supabase tables (after `pg_dump` backup via W01)
- **DB column audit (user scope-add 2026-04-18)** — walk every `public.*` table, enumerate columns, check which are read/written in `src/services/*` + `src/pages/*` code. Produce `research/DB_COLUMN_AUDIT.md` with per-table: `used` / `unused` / `refactor-candidate`. Unused columns surface as DROP candidates for next migration round.

**Out:**
- Anything ambiguous — parks to `research/DEAD_CODE_PARKED.md` for user decision

## Dependencies on other cards

- W02 orphan list
- W01 for DB-table `pg_dump` before drop

## Open workflow questions

- **Q-W06-a** ✅ **Scope expanded per user (2026-04-18)**: don't just list dead tables — walk **every table column by column**, mark which are read/written in code vs unused. Surface DROP candidates at both table-level AND column-level. User confirms each before any DROP. Output → `research/DB_COLUMN_AUDIT.md`.
- **Q-W06-b** ✅ **Default accepted (one branch per subsystem)** — Claude translation: when we delete big chunks of code (e.g., openclaw agent = 20+ files), we can either (a) put them all on one catch-all branch `archive/pre-refactor`, or (b) split by feature: `archive/openclaw-agent`, `archive/old-email-inbox`. Option (b) wins — easier to revive or reference a single subsystem later. Chose default.

## Done-when

- openclaw-agent deleted, archive branch pushed
- Old email inbox deleted, archive branch pushed
- knip/ts-prune scan clean (<5% orphans remaining, all triaged)

## Results + corrections log (2026-04-18)

### ✅ Completed

- 8 safe-delete files (3 `.backup` + 5 debug pages) removed — ~1,841 LOC, tsc clean
- `src/App.tsx` imports + `/nastest` + `/testthumbnail` routes pruned
- openclaw-agent: research found 0 remaining files — already gone before W06 started
- old email inbox: research found 0 remaining files — already gone

### 🔴 Retracted — DB column DROP verdicts ALL wrong

The first W06 research agent claimed 3 "high-confidence DROP" DB columns. **User challenge on 2026-04-18 caught all 3 as false-positives.** Verification:

| Column | Agent verdict | Actual state | Evidence |
|---|---|---|---|
| `worker_ot.perf_rating` | "write-only, never read" | **Heavily read** — conduct score on `/performancereview`, `coordinator/WorkerOTTable`, `WorkerOTRow`, `WorkerOTDetails`, `ReviewModal`, `AllHistory`, plus DB function `get_performance_review_by_date()` | 31+ `.perf_rating` references across 9 `.tsx` files in `src/` |
| `trial_trenches.additional_notes2` | "truly unused" | **1,235 / 2,795 rows populated (44%)** — filled by JLTT CSV import function | [20250907_201356-create-jltt-import-table-matching-csv-format.sql:309](supabase/migrations/20250907_201356-create-jltt-import-table-matching-csv-format.sql#L309) |
| `trial_trenches.additional_notes3` | "truly unused" | **1,490 / 2,795 rows populated (53%)** — same JLTT CSV import | [20250907_201356-…:310](supabase/migrations/20250907_201356-create-jltt-import-table-matching-csv-format.sql#L310) |

**All 3 columns are now explicitly marked KEEP.** Dropping any of them would have caused data loss + broken modules.

### 🔴 Additional finding — research reports were never written

The agent's completion summary claimed `DEAD_CODE_REPORT.md` and `DB_COLUMN_AUDIT.md` were written to `docs/99-refactor/_system/research/` — **they are not on disk.** The verdicts I surfaced to the user were sourced from the agent's reply message, not a persisted artifact. This is a hard failure mode: we acted on phantom research. Logging to `agent_corrections`.

### 📋 Pending (revised → all resolved 2026-04-18)

- ✅ **3 singleton merges** — executed 2026-04-18. 3 files moved, 5 imports patched, tsc clean.
- ✅ **60 knip orphans deleted** — re-ran knip fresh, 2-pass independent verification (basename grep + tight import-pattern grep) found 60 truly safe out of 154 flagged. Deleted via `git rm`, ~17,029 LOC gone, tsc clean. The other 94 were knip false positives (root CSS, generated Supabase types, hook references that knip missed).
- ~~3 "high-confidence DB column DROPs"~~ — ALL RETRACTED (`perf_rating`, `additional_notes2/3`).
- ~~5 "HITL DB column decisions"~~ — RE-AUDITED 2026-04-18, all 5 confirmed USED: `lunch_ot` (OT calc), `sync_batch_id` (NAS sync tracking), `pc_nas_folder_path` (progress claim UI), `progress_claim_day` (monthly claim day UI), `line_total` (quotation totals + PDF template + DB function).
- **DB column audit as a whole — CONCLUDED: 8 for 8 wrong.** The audit agent produced zero useful signal. DB column cleanup parked; re-visit during W09 per-module migration where we're already deep in each data model.

### Final W06 totals (code side)

| Category | Files removed | LOC removed |
|---|---|---|
| Backup / debug files | 8 | 1,841 |
| Singleton merges (moves, not deletes) | 3 moved | 0 (just relocated) |
| knip-verified orphans | 60 | 17,029 |
| **Total** | **68 removed** | **~18,870** |

tsc stays clean. No UI regression. Bundle shrunk.

### Next safe W06 actions (green light)

- 3 singleton merges (verified)
- The already-done 8 file deletions (already shipped)

### Next W06 actions requiring re-audit

- Any DB column DROP — run fresh grep + fill-rate query per column
- Any knip orphan deletion — re-run knip + cross-check manually
