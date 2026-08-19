# Tools — Shared Tool Chrome

The shell, header, customer bar and panel atoms behind every numbered tool in
[`src/lib/toolRoutes.ts`](../../../lib/toolRoutes.ts): **01 Prospect Profiler ·
04 Tax calculator · 05 SRS planner · 06 Legacy Map**, plus the Client Report.

## Why this group exists (2026-08-19)

`toolRoutes` has always listed the profiler as tool 01 beside the planning
tools, and the nav rail renders them as one band — but the chrome lived in
`features/crm/planning/components/`, so only tools 04–06 could reach it. The
profiler had grown its own header, its own measure and its own panel treatment,
and the rail pointed at two visual languages.

`no-cross-feature-imports` (`.dependency-cruiser.cjs`) is why the fix is a
hoist rather than an import: feature workspaces are islands, and `profiler` may
not read `crm`. So the **markup** moved to this shared lane and the **data**
stayed in each feature.

## Navigation

| File | What it is |
|---|---|
| `ToolPageShell.tsx` | Page surface + measure. `wide` (`max-w-5xl`) for the two-column tools, `reading` (`max-w-[42rem]`) for the profiler wizard |
| `ToolPageHeader.tsx` | Breadcrumb → brown index numeral → serif 38px title → description → one optional `action` slot |
| `ToolCustomerBar.tsx` | "Who is this for?", asked inside the tool. **Presentational** — takes options, returns a choice, fetches nothing |
| `ToolAtoms.tsx` | `ToolPanel` · `ToolStatGrid` · `SummaryRow` · `ToolSelect` · `ToolNote` |

Import through the barrel: `@/components/primitives/tools`.

## Before working here

- **The customer bar must stay presentational.** Each feature wraps it with its
  own hook (`crm/hooks/useOwnClientOptions`, `profiler/hooks/useOwnCustomerOptions`),
  its own service and its own query key. Hoisting the fetch into this folder
  would put the customer record in a shared lane — the move
  [planning/decisions.md](../../../features/crm/planning/decisions.md) 2026-07-28
  rejected, and the reason `PlanningToolFrame` did not move here wholesale.
- **`ToolPanel`'s default label colour is ground-specific.** `text-muted-foreground`
  is AA on the two flat creams only (4.72:1 on card cream). A panel painting its
  own tint passes `labelClassName="text-[color:var(--fg-dim)]"`. Don't widen the
  default — see the prop's own note.
- **`max-w-[42rem]` is a deliberate literal**, not a missed `max-w-2xl`.
  `--container-2xl` is a leftover v3 shim set to 1400px and v4 reads it, so
  `max-w-2xl` silently goes full-bleed. Documented in `ToolPageShell`.
- These are 2a spec treatments, not inventions — KOPI_2A_SPEC → "Archetype —
  detail" → Panels, and "Layout language" → Cards/Rhythm.

## 📚 Related

- [../CONTEXT.md](../CONTEXT.md) — the primitives inventory
- [src/lib/toolRoutes.ts](../../../lib/toolRoutes.ts) — the tool list itself
- [.claude/rules/light-theme.md](../../../../.claude/rules/light-theme.md)
- [KOPI_2A_SPEC.md](../../../../docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md)
