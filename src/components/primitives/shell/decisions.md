# Decisions — src/components/primitives/shell

Last Updated: 2026-08-19

## 2026-08-19 — The rail lists its tools under a heading; only the leftovers collapse

**Supersedes**: 2026-08-18 — collapse every tool into the "Others" disclosure

**Decision**: `AppSidebarNav` renders a permanent, always-open **Tools** band —
the entries from `lib/toolRoutes` the viewer is granted — between Customers and
the "Others" disclosure. "Others" survives, but now carries ONLY the granted
modules no band above claimed (Results, CRM Dashboard, Manage Accounts, anything
registered later) and renders nothing when that set is empty.

**Why**: 2026-08-18 hid the tools on the argument that five extra rows bury the
two destinations an advisor navigates BETWEEN. The heading is what settles that
without hiding anything: under a "TOOLS" label the five read as one group rather
than five more peers, so Overview and Customers keep their weight AND the
toolbox can be read without being opened. Requested directly (2026-08-19) after
seeing the collapsed rail — an advisor could not tell what the app could do
without clicking a disclosure named after nothing in particular.

**Impact**: the tools no longer depend on `othersOpen`, so `SidebarContext`'s
flag governs only the catch-all; the auto-expand-when-route-is-inside effect
still runs, but for leftovers alone. Band type tokens (`BAND_TEXT`, `BAND_LABEL`)
now live in `SidebarItem` so the static heading and the disclosure button cannot
drift. The band is `role="group"` + `aria-labelledby`, so a screen reader gets
the grouping the eye gets. Pinned by the rail assertion in
`tests/workflows/crm/dashboard.spec.ts` ("the rail leads with Overview +
Customers…"), which now checks the tools are visible with NO interaction.

**Note**: adding a tool to `lib/toolRoutes` now adds a visible rail row — it is
no longer hidden behind a click. Weigh that before adding one.
