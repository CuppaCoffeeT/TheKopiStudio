# Runners — Multi-Tool Evidence Harness

Non-UI checks: DB rows (Supabase service-role), NAS files (SMB at `/Volumes/JLQI/`), agent ticks, seed data. Composed by specs alongside UI assertions to form the W04 multi-tool evidence harness.

## Scope

**Belongs**: pure-function helpers that hit a non-UI tool (Supabase / NAS / agent / Gmail) and return a verdict the spec can assert on.
**Doesn't**: UI interactions (→ `../pom/`); spec orchestration (→ `../workflows/`); test data shape (→ `../fixtures/`).

## Navigation

| File | Tool | Purpose |
|------|------|---------|
| `supabaseChecks.ts` | Supabase | Generic row-exists / count assertions via service-role client |
| `quotationChecks.ts` | Supabase + UI | Quotation lifecycle assertions (status flips, audit log entries) |
| `clientContactsChecks.ts` | Supabase | Client contact CRUD assertions |
| `nasChecks.ts` | NAS (SMB) | File-exists / folder-shape assertions on `/Volumes/JLQI/` |
| `agentTick.ts` | Agent runtime | Trigger an autonomous-agent tick + wait for state transition |
| `w05aSeed.ts` | Supabase | W15.01 RLS test seed |

## Before working here

- **One file = one tool surface**: don't mix Supabase + NAS in one runner. Compose at the spec level.
- **Service-role client**: only runners may use service-role keys (specs/POMs use the user session). Keep the client construction internal.
- **Idempotent + cleanable**: every seed runner must export a paired `cleanup<X>()`. Specs call it in `afterEach` so no `is_test_data=true` rows leak.
- **NAS retries**: Synology returns code 119 transiently — `nasChecks.ts` retries up to 3× with 500ms backoff (see lessons.md).
- **Popover race**: Radix Popover open events fire twice on first paint — `quotationChecks.ts` uses 3-retry click pattern.

## 📚 Related

- [tests/CONTEXT.md](../CONTEXT.md) · [tests/workflows/CONTEXT.md](../workflows/CONTEXT.md)
- [W04_PLAYWRIGHT_SEATBELT.md](../../docs/99-refactor/_system/workflows/W04_PLAYWRIGHT_SEATBELT.md)
