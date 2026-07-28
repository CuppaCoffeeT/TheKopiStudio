# Planning — Lessons

**Last Updated**: 2026-07-28 SGT

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
