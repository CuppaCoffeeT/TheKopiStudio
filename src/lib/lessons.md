# Lessons — src/services/

Last Updated: 2026-05-06

## 2026-05-06 — `claimable_items` had no DB-level uniqueness for NCE-linked rows
**What happened**: Project 7731 (and one other) accumulated 2–3 `claimable_items` per `nce_submission_id`, all auto-created within <100ms. `getByNceSubmission` then threw on `.maybeSingle()` because multiple rows matched. The throw was swallowed by the save handler's try/catch, so subsequent `autoDeleteNCEItem` calls (triggered by user marking the NCE `not_claimable=true`) never ran — stale rows persisted in the Completed Work panel.
**Root cause**: Application-level "check existing → insert if null" race in `autoCreateNCEItem` with no DB-level constraint. The save handler in `ProjectDetailPage.tsx` runs the sync in a loop that can fire twice for the same submission within milliseconds.
**Fix**: (1) Cleaned 5 duplicate/stale rows. (2) Added partial unique index `claimable_items_nce_submission_unique ON (nce_submission_id) WHERE item_type='nce_submission'`. (3) Changed `getByNceSubmission` from `.maybeSingle()` to `.order('created_at').limit(1)` so it tolerates legacy dupes. (4) `autoCreateNCEItem` catches Postgres error code `23505` and treats unique-violation as "already exists, return existing".
