# Archived migrations (retired 2026-08-13 — superseded by the baseline squash)

These 10 files were `supabase/migrations/*.sql` until the CI test-DB isolation work
replaced them with `../00000000000000_baseline_prod_schema.sql`.

**Kept, not deleted** — they are the only in-repo record of how the schema was
*intended* to evolve, and code-hygiene forbids discarding debugging history. They sit in
this subdirectory because the Supabase CLI globs `supabase/migrations/*.sql`
non-recursively, so nothing here is ever applied.

## Why they were retired

| Problem | Detail |
|---|---|
| Didn't match prod | They drift from prod's actually-applied history — see [MIGRATION_SYSTEM_RECONSTRUCTION.md](../../../docs/06-operations/migrations/MIGRATION_SYSTEM_RECONSTRUCTION.md). |
| Didn't build the DB | They never `CREATE` the 15 public tables, so `supabase db reset` produced an empty schema — the repo could not rebuild its own database. |
| Colliding versions | The CLI parses the version as the digits before the FIRST `_`, so `20260611_162101_…` and its seven siblings are all version **`20260611`** — a duplicate-version error, not a valid history. |

## If you need one

Read it for intent, then express the change as a NEW timestamped migration on top of the
baseline. Never re-add a file here to the apply path.
