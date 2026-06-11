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
