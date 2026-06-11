# Profiler — Feature Memory

DISC × MBTI prospect-profiling domain: public wizard (`/profiler`, TOOL, anonymous-friendly) + saved results (`/profiler-results` LIST, `/profiler-results/:id` DETAIL). One folder for both surfaces — module rows ≠ folders (see `lib/decisions.md`).

**Status: IN BUILD (P1 scaffold).** Pages are honest stubs on real frame primitives — no data wiring, no scoring lib yet. Filled in by PROFILER_MODULE_PRD phases P2 (lib port) → P3 (wizard) → P4 (results).

**P4a (results list) is LIVE**: `ResultsListPage` wired to `public.results` via `getResultsPaginated` (server-side `.or()` ilike search across prospect/advisor/mbti/disc_primary + `.range()` pagination) → `useResultsList` (`queryKeys.profilerResults.list`, `keepPreviousData`) → `ListPageFrame` + `MobileListCard` cards; NULL-owner rows show an "unclaimed" badge; row click → `/profiler-results/:id`.

**P3 (public wizard) is LIVE**: `ProfilerWizardPage` is the full legacy port — intake (names default Advisor/Prospect, meeting default '1') → 2 question screens (Next gated on 4 answers) → 5 optional NV screens (last = "Generate Profile →") → result report in frozen legacy section order with auto-save (`useSaveResult`: auth insert+`.select().single()`+invalidate; anon fire-and-forget + login CTA). NEW per PRD: sessionStorage draft (`profiler-wizard-draft`, restored mid-flow, cleared on generate/exit) + duplicate-save guard (input signature, notes excluded). WizardShell primitive intentionally NOT used (Modal composition with 60vh body fights a full-page touch-first flow) — composed Progress + Cards + fixed footer instead. PDF = `window.print()` + `lib/print.css` (`.rph` print header, `.print-hide` chrome); CSV = `lib/export.ts`, filename `profile_<name>_<yyyy-mm-dd>.csv`.

**P4b (result detail) is LIVE**: `ResultDetailPage` (DetailPageFrame, fullWidth) rebuilds the FULL report from the stored row by reusing the SAME `wizard/result/` section components — `StoredResultReport` + `storedReportModel` replay `calcProfile(raw_answers, TRUE nv ids, occupation)` for bars + faithful MBTI strengths while stored scalars (disc_primary/secondary/mbti) always win the headline; NULL/invalid `raw_answers` degrades to a scalar-only report (stored score bars, MBTI card swapped for an info Alert). Notes edit (Modal+Textarea) and delete (DestructiveConfirmDialog, back-to-list on success) on OWN rows only — others show "Read-only — saved by another advisor or anonymously" (RLS enforces; blocked notes update surfaces via showError). PDF prints just the report via `.print-area` (appended to `lib/print.css`, visibility pattern — frame chrome can't take `.print-hide` per element); CSV = `lib/export` from stored fields, download-date filename (legacy `dlCSV` parity).

## Map

| Dir | Contents |
|---|---|
| `pages/` | `ProfilerWizardPage` (public TOOL, full 7-step flow + report + auto-save, own Suspense in App.tsx) · `ResultsListPage` (ListPageFrame) · `ResultDetailPage` (DetailPageFrame, stored-row report rebuild + own-row notes/delete) |
| `lib/` | `decisions.md` · `content.ts` (QS/NVG/PR) · `scoring.ts` (calcProfile/occNudge) · `export.ts` (CSV) · `print.css` (.rph/.print-hide) · `labels.ts` (age ranges, meeting select options, MBTI dim defs) · `meeting.ts` (legacy meeting-stage label maps, full + short) + golden-master fixtures |
| `api/` | `resultsService.ts` — single results access layer: `getResultsPaginated` (list, sanitized `.or()` search) + detail/notes/delete fns |
| `hooks/` | `useResultsList` (list query, keepPreviousData) · `useResultDetail` (detail query, null = not-found/RLS-hidden) · `useResultMutations` (`useUpdateResultNotes` + `useDeleteResult`; invalidate `.all` + `.detail(id)`; delete navigates to list) · wizard: `useWizardState` (flow machine + draft), `savePayload` (pure insert builder + dup-save signature, unit-tested), `useSaveResult` (auth/anon insert paths) |
| `components/` | `DiscChip` (pri/sec DISC pill pair, PR palette dot/tint, AA-safe text) · `wizard/` (`IntakeForm`, `QuestionScreen`, `ObservationScreen`, `WizardTopBar`, `WizardAtoms`, `result/` report composition) · `detail/` (`StoredResultReport` row→report composition over `wizard/result/` sections, `storedReportModel` scoring replay, `ResultDetailActions` PDF/CSV/notes/delete + read-only hint, `ResultNotesModal`) |
| `types.ts` | flat; re-exports generated `results` row types |

## Hard constraints

- Reads/writes legacy `public.results` byte-compatibly — NO schema/RLS changes this PRD. Legacy app shares the table until cutover.
- Anonymous insert works but anon cannot SELECT back → fire-and-forget save (never `.insert().select()` for anon).
- NULL-owner legacy rows are read-only (no RLS update path) — UI must explain.
- Scoring must replicate legacy `calcPf`/`occNudge` exactly (ties D>I>S>C, E/S/T/J) — golden-master gated.
- Query keys: `queryKeys.profilerResults` only.

## 📚 Related

`docs/05-implementation/active/PROFILER_MODULE_PRD.md` · `lib/decisions.md`
