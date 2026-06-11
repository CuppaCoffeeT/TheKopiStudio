# W17 — Component library + test page

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-19 SGT — **🟢 CLOSED · X6 ✅ committed.** v1+v2 picks locked across 7 real-choice slots; v3 added Translucent layer + glass header pattern + near-black CTA pattern (Linear/Vercel — primary CTA = `zinc-700`, brand red kept as ACCENT only for status badges, notification dots, picker selection, focus rings). 3 mockups proved composition: Quotation List · SupervisorWorkEntry mobile · EOS Dashboard. User said "looks good · roughly there · let the rest of the design in W08" 2026-04-19. Full picks + W07/W08 follow-up handoff in [LOCKED_PICKS.md](../LOCKED_PICKS.md). DAG flag `components_chosen` SET. W07 + W08 unblocked.
**Status**: 🟢 CLOSED 2026-04-19 · X6 ✅ committed · LOCKED_PICKS v3 locked · DAG flag `components_chosen` SET
**Priority**: 🟡 High

**Goal**: Inventory every typical component we use, evaluate candidates from motion.dev + 21st.dev + ui-ux-pro-max + shadcn, build a `/design-lab` test page with the chosen set, and get user validation before W07/W08 roll out.
**Tier**: Now · **Status**: 🟢 PRODUCTION · **Automation**: 👀 HITL
**Blocked by**: W02 (component usage feeds inventory) · **Blocks**: W07 (primitives consume chosen set), W08 (tokens style them)

## Why this exists

User: *"set this standard, then in the future we have beautiful design without much effort... currently feels like AI slop"*. Picking a component library blind is the same mistake as writing primitives without research. W17 is the hands-on "touch and feel" step — build a test page with the real components, validate, propagate.

## Scope

**In:**
- **Inventory every typical component used in AppBase + future needs**:
  - Forms (complex validation, multi-step, autosave)
  - Data tables (filters, sort, server pagination, row expand)
  - Dashboard cards (metric + trend + action)
  - Navigation (sidebar collapse, breadcrumb, tabs, command palette)
  - Overlays (modal, drawer, popover, tooltip)
  - Feedback (toast, empty state, loading skeleton, error state)
  - Inputs (combo box, date picker, file uploader, rich text)
  - Charts (line, bar, sparkline, kpi)
  - Status (badge, pill, stepper, progress, timeline)
  - Layout (grid, stack, scroll area)
  - Motion (page transition, scroll reveal, hover inertia, enter/exit)
- **Candidate pool**:
  - shadcn (current baseline)
  - [21st.dev/community/components/featured](https://21st.dev/community/components/featured)
  - [motion.dev](https://motion.dev) examples
  - ui-ux-pro-max-skill.nextlevelbuilder.io
  - Radix primitives
  - Vercel templates + Linear design patterns
- **Selection criteria**: (1) visual polish no-compromise · (2) mobile-responsive by default · (3) scroll-motion friendly · (4) composes with shadcn/Radix conventions · (5) not another AI-slop pattern
- **`/design-lab` test page**:
  - Mount the chosen set with real-ish data
  - Wire Motion scroll/hover/enter transitions
  - Demo dark + light + mobile (375px baseline)
  - Access-gated behind admin + dev module
- **Motion integration**: scroll-triggered reveals, inertia on cards, page transitions via CSS `view-transition-name`, signature moments (login success, save confirm, nav)
- **User validates**: *"yes this is the look"* → commits X6 ✅ → feeds W07/W08

**Out:**
- Tokens / fonts / colors (W08 owns those)
- Writing the primitives themselves (W07)
- Redesigning components ground-up (we compose, don't invent)
- Page-level layouts (W09 per module)

## Inputs / Outputs

| What | From | To |
|---|---|---|
| Component inventory | W02 + user additions | `research/COMPONENT_INVENTORY.md` |
| Candidate evaluation | this card | `research/COMPONENT_CANDIDATES.md` |
| Chosen set | this card | X6 ✅ in SYSTEM_OVERVIEW + updates to W07 + W08 |
| Live test page | this card | route `/design-lab` (module-gated) |

## Dependencies on other cards

- Reads W02 duplication map (real usage patterns)
- Blocks W07 (primitives wrap these)
- Blocks W08 (tokens style these)
- `/design-lab` lives at `src/features/design-lab/` as the reference implementation

## Open workflow questions (HITL verified answers below:)

- **Q-W17-a** Keep shadcn baseline or replace? ans: keep — augment with 21st.dev + motion choices; don't rewrite what works, but we need to have a page where we list down all the components (like button cards etc. etc.) then where we get them from 21st dev motion ui ux pro max etc. and and other consideration (must be concise)
- **Q-W17-b** Motion strategy — library-level (all components animate) or surgical (specific moments)? ans: hybrid — library defaults subtle, surgical crazy-motion for signature moments, it needs to be minmalistic however surgical crazy-motion for signature moments, we need to redesign the whole concept again, and @/Users/tanweijie/repo/AppBase/trench-trace-portal-app/docs/01-system-architecture/DESIGN_SYSTEM.md will be deprecated, but we can go into more detial later
- **Q-W17-c** `/design-lab` access — module-gated (admin + dev) or public? ans: module-gated — staff preview future look reduces launch surprise
- **Q-W17-d** ✅ **Default accepted (2–3 candidates per slot)**. For each component type (data table, contact picker, etc.), `/design-lab` renders the shadcn baseline + 1–2 alternatives pulled from 21st.dev / motion.dev / ui-ux-pro-max. User picks one in-place. More than 3 → decision fatigue; fewer than 2 → feels like we didn't look.

## Done-when

- `COMPONENT_INVENTORY.md` complete
- `COMPONENT_CANDIDATES.md` evaluated (top 2-3 per slot + pick)
- `/design-lab` renders every chosen component with motion + dark/light/mobile
- User accepts: "this is the look"
- X6 marked ✅ in SYSTEM_OVERVIEW
- Sets DAG flag: **`components_chosen`**

## Related

- [W07_SHARED_PRIMITIVES.md](W07_SHARED_PRIMITIVES.md) — consumes the chosen set
- [W08_DESIGN_SYSTEM.md](W08_DESIGN_SYSTEM.md) — tokens style the chosen set
- [CRON_MANAGER UI_UX_DESIGN.md](/Volumes/YourVolume/JLCD_COMPANY/DEVELOPER/CRON_MANAGER/_planning/1_RESEARCH/UI_UX_DESIGN.md) — prior user research
- https://motion.dev — motion library
- https://21st.dev/community/components/featured — component marketplace
