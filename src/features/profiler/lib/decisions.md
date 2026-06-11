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

## 2026-06-11 — Question-set freeze (versioning required for any copy edit)

`QS` question/option order and `NVG` item ids are part of the PERSISTED data
contract, not just UI copy: every saved row's `raw_answers` stores the option
index (`oi`) per question and `nv_observations` is keyed by NvItem id. Detail
reconstruction and the golden-master replay resolve those indexes/ids against
the CURRENT content arrays — reordering options, inserting questions, or
renaming observation ids would silently re-interpret historical rows. Any
future copy edit therefore needs an explicit versioning decision (e.g. a
content-version column or an id-stable migration) BEFORE it ships. Pure
wording fixes that keep array positions and ids intact are safe.

## 2026-06-11 — Report bars hand-rolled, NOT the Progress primitive

The wizard's step header DOES use the `Progress` primitive (neutral tone fits
there). The report's DISC score bars (`ScoreCard`) and MBTI strength bars
(`MbtiCard`) are hand-rolled `role="progressbar"` divs instead: `Progress`
locks its fill tones to neutral/active/success/error (slate/red/green by
design — "Locked" in its header), while the report bars ARE the legacy DISC
colour identity (`PR[d].col` per letter, amber for MBTI) with relative-to-max
widths and "{pts} pts" labels. Re-skinning the primitive would break its
locked design contract; the hand-rolled bars keep full a11y semantics
(aria-valuenow/min/max + labels).

## 2026-06-11 — Anonymous saves preserved (explicit product decision)

The wizard stays public and anonymous results keep saving with `user_id`
NULL — live legacy behaviour preserved by explicit user decision (PRD
"Resolved decisions"). Mechanics follow the untouched legacy RLS: anon can
INSERT (`WITH CHECK true` + anon grants) but has NO SELECT path, so the anon
save is fire-and-forget (`.insert()` without `.select()`; representation
would 403). The new app never sends a spoofable `user_id` when logged out;
tightening the policy itself is cutover work. Consequence: anonymous rows are
visible only to managers and are read-only until the cutover backfill claims
them.

## 2026-06-11 — DISC/MBTI tie-breaks encoded explicitly

Legacy `calcPf` relied on object insertion order + stable sort for DISC
ranking; the port encodes the resulting tie order EXPLICITLY — D > I > S > C
for both primary and secondary (`DISC_TIE_ORDER` in `lib/scoring.ts`), and
MBTI dimension winners use `>=` so ties collapse toward E/S/T/J. Locked by
the golden-master suite and the tie-break corpus in
`lib/__tests__/scoring.test.ts`; do not "fix" to alphabetical or random.
