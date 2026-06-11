# W03 — Workflow inventory audit

**Goal**: Capture every user-facing workflow with click-by-click steps + per-tool post-action evidence checks (UI + DB + NAS + Gmail + desktop). Each captured workflow becomes one row in [WORKFLOW_LEDGER.md](../ledgers/WORKFLOW_LEDGER.md). Paired track with W04 — see **[W03_04_EXECUTION_PROTOCOL.md](W03_04_EXECUTION_PROTOCOL.md)** for the 9-phase pipeline + T1/T2/T3 tiering.
**Tier**: Now (S2) · **Status**: 🔴 PLANNED — Phase 0 spec locked 2026-04-18; Phase 1 next (capture WF-0001 Login) · **Automation**: hybrid — Phase 1-3 user-walks-through · Phase 5-6 T1/T2 browser-driven autodiscovery · Phase 7 T3 manual
**Blocked by**: nothing for Phase 1 · Phase 5+ needs Playwright + Modules tab (W11.02) · **Blocks**: W04 (paired, not sequential) · W09 merges (gated on P0 green) · W11.02 (needs data) · W22 (needs ≥1 green spec)

## Why this exists

DRY targets aren't found by reading code — they're found by reading journeys. User flagged 3 places to add a client contact; there are likely 10+ more similar cases. Mapping workflows surfaces the real duplication and defines what Playwright must cover.

## Scope

**In:**
- Narrative list of every core user workflow (CRUD per domain entity + multi-step like quotation → award → invoice → claim)
- Per-workflow: entry points (URLs), required permissions, DB writes, side effects (emails, WhatsApp, NAS writes)
- Cross-workflow redundancy report (e.g. "add client contact" diff across 3 entry points — which fields differ, which validations differ)
- Mobile-specific variations flagged
- Output: [WORKFLOW_LEDGER.md](../ledgers/WORKFLOW_LEDGER.md) (per-row status per tool) + `tests/workflows/<domain>/<name>.spec.ts` + `<name>.checks.yaml` (post-action evidence declarations)

**Out:**
- Admin/internal workflows (agent dashboard, self-improvement, learning-agent UI) — separate pass if time remains

## Dependencies on other cards

- Reads from W02 routes table
- Blocks W04 (tests need the workflow list), W07 (primitives shape driven by redundancy)

## Open workflow questions

- **Q-W03-a** ✅ **P0 first, stub the rest** (2026-04-18). 18 P0 workflows listed in [W03_04_EXECUTION_PROTOCOL.md](W03_04_EXECUTION_PROTOCOL.md#p0-workflow-list-g1-gate); user validates before capture starts.
- **Q-W03-b** ✅ **Yes — mobile flows as separate entries** (e.g., Login-worker-mobile WF-0003 distinct from Login-admin WF-0001).
- **Q-W03-c** ✅ **Hybrid capture** (revised 2026-04-18). Phases 1-3 + Phase 7: user walks through, Claude captures + writes spec (human-in-driver's-seat). Phases 5-6: T1/T2 browser-driven autodiscovery (agent drives real app via MCP browser tools — evidence is observed app behavior, NOT agent keyword-scanning of code). Code-scanning discovery remains rejected; browser-observation discovery is OK because the running app is the source of truth. See [W03_04_EXECUTION_PROTOCOL.md#tiered-autodiscovery-t1t2t3](W03_04_EXECUTION_PROTOCOL.md#tiered-autodiscovery-t1t2t3).

## Done-when

- [WORKFLOW_INVENTORY.md](../ledgers/WORKFLOW_INVENTORY.md) lists all P0 workflows with complete step lists + test IDs
- [WORKFLOW_LEDGER.md](../ledgers/WORKFLOW_LEDGER.md) reflects capture status per row
- Non-P0 workflows stubbed (name + tier only) — captured incrementally post-G1
- Redundancy report optional — W07 can grep the inventory directly
