# Profiler — Decisions

## 2026-06-11 — Lazy routes (base convention over stale SOP line)

All profiler routes in `App.tsx` use `React.lazy()` + Suspense, per the base's
own convention (App.tsx header comment: "Lazy-load them with React.lazy() so
each page becomes its own chunk"). MODULE_CREATION_SOP's "direct import" line
is stale and was deliberately not followed (verified in the PRD research,
PROFILER_MODULE_PRD.md § Wiring). The public `/profiler` route sits OUTSIDE
the DashboardLayout group (sibling of `/login`, no ProtectedRoute — sanctioned
public route) so it carries its OWN `<Suspense>` boundary with the same
fallback DashboardLayout uses; the protected routes reuse DashboardLayout's
single Suspense boundary.

## 2026-06-11 — One feature folder per DOMAIN, not per module row

`src/features/profiler/` hosts BOTH the wizard (`/profiler`) and the saved
results surfaces (`/profiler-results`, `/profiler-results/:id`). Module rows
drive tiles + access control; folders follow the domain: wizard and results
share content (QS/NVG/PR), the scoring engine, export builders and the
`results`-table types — splitting them would force cross-feature imports of
`lib/` internals through barrels. Account Settings and Manage Accounts are
separate domains and get their own feature folders.

## 2026-06-11 — Wizard composed from Progress + Cards, NOT WizardShell

The `WizardShell` primitive is a Modal composition (overlay + `max-h-[60vh]`
scrollable body + step-chip header) built for short 3–4 step desktop form
wizards. The profiler flow is a PUBLIC, full-page, touch-first 7-step flow
ending in a long scrolling report — putting it inside a modal fights mobile
ergonomics, print layout and the legacy UX. Per the PRD escape hatch, the
wizard composes `Progress` (sticky "Step n of 7" header), `Card`-based
screens and a fixed bottom Back/Next bar (44px targets, safe-area inset)
instead. `WizardFooter`/`WizardStepperHeader` were not reused either: both
assume the Modal action-row idiom (`ModalGhostAction`/`ModalPrimaryAction`).

## 2026-06-11 — Wizard draft persistence + duplicate-save guard (NEW vs legacy)

PRD-sanctioned additions to the otherwise faithful port: (1) screens 1–7
persist `{screen, intake, answers, nv, notes}` to sessionStorage key
`profiler-wizard-draft` — restored on refresh, cleared on generate and on
explicit exit (exit = Back from screen 1, confirmed when mid-flow; legacy
`go(0)` semantics of keeping intake fields are preserved). (2) Auto-save on
generation is guarded by an input signature (intake + answers + TRUE-ticked
ids, sorted; notes EXCLUDED — legacy saved once at generation, later note
edits were export-only). Regenerating with unchanged inputs skips the insert
and keeps the saved state; "Profile Another Prospect" resets the guard.
