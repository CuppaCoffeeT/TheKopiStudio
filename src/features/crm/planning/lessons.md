# Planning — Lessons

**Last Updated**: 2026-08-19 SGT

## 2026-07-28 — A future date of birth opened the tax calculator on age −60

**What happened**: the tax calculator, seeded from a customer record, rendered
an Age field reading `-60`. Every age-banded relief then silently took its
lowest branch (CPF relief at the 20% under-45 rate, Earned Income Relief at
$1,000) without any visible error.

**Root cause**: TWO things composing, neither wrong on its own. The
`DatePicker`'s `dd/mm/yy` field infers the century forward, so a date of birth
typed as `15/03/86` stores **2086-03-15**. `ageFromDOB` is a deliberately plain
year subtraction (`refYear - birthYear`, golden-locked by the CRM report's
oracle tests), so it correctly returned `2026 - 2086 = -60`. Nothing validated
the result before it became a calculator input.

**Fix**: `lib/customerSeed.ts` — `seedAge` clamps to a plausible advice range
(16–100) and falls back to 40 for anything missing, unparseable or impossible.
All three tools seed through it. `ageFromDOB` was NOT touched: a nonsense age
is a nonsense INPUT, and inputs get validated at the boundary, not inside
oracle-locked math.

**Not fixed here**: the `DatePicker` century inference. It is a shared primitive
with its own tests and its own adopters; changing how it reads a two-digit year
is a separate, wider decision. Flagged to the user 2026-07-28.

**Lesson**: when a tool pre-fills from another feature's stored data, the
pre-fill is an INTEGRATION BOUNDARY. Validate there. "The source field is
already validated" is not the same claim as "every value now in the column is
sane" — the column has history, and pickers change.

## 2026-07-28 — `npm run db:types` wrote to a file nothing imported

**What happened**: the script generated types into `supabase/remote_types.ts`,
but the app imports `src/integrations/supabase/types.ts`. Regenerating after a
migration would appear to succeed and change nothing.

**Root cause**: the two paths drifted at some point; nothing failed loudly
because the generated file is valid TypeScript that simply has no importers.

**Fix**: `db:types` now writes to `src/integrations/supabase/types.ts` and uses
`--project-id` rather than `--linked` (which needs a local `supabase link`).

**Lesson**: a codegen script that writes to an unimported path fails silently
forever. When touching one, grep for an importer of its output.

## 2026-08-19 — The DatePicker century inference is fixed at the source

**What happened**: nothing new broke. This closes the "**Not fixed here**" item
left open by the 2026-07-28 entry above.

**Root cause**: recorded in full at
`src/components/primitives/form/lessons.md` (2026-08-19) — three composing
defects in the shared picker: a hardcoded 2020–2030 year window, a parser that
added 2000 to every two-digit year, and a focus handler that re-seeded the edit
buffer with the two-digit year (so a focus/blur alone could shift the century).

**Fix**: bounds are now relative to the SG year; the two-digit pivot keys off
the field's own `toYear`; the date-of-birth field uses `variant="birth"` —
a 120-year window, no future days, and a spelled-out `dd MMM yyyy` display.
Verified against prod: no `clients` row currently holds a future
`date_of_birth`, so no data repair was needed.

**Supersedes** the "Not fixed here" paragraph of the 2026-07-28 entry.
`seedAge`'s clamp is deliberately KEPT — see the updated header in
`lib/customerSeed.ts`. The picker being correct today says nothing about the
rows written before today, which is the whole point of validating at the
boundary.
