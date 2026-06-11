# Profiler — Feature Memory

DISC × MBTI profiling (shipped): public wizard `/profiler` (TOOL, anonymous-friendly, outside DashboardLayout) + `/profiler-results` LIST + `/:id` DETAIL. One folder, two module rows (`lib/decisions.md`).

## Map

- `pages/` — `ProfilerWizardPage` (7-step flow + report + auto-save) · `ResultsListPage` (URL pagination, ilike search, "unclaimed" badge) · `ResultDetailPage` (own-row notes/delete)
- `lib/` — `decisions.md` · `content.ts` → `content/*` (QS/NVG/PR, frozen copy) · `scoring.ts` (exact calcPf/occNudge port) · `export.ts` · `print.css` · `labels.ts` · `meeting.ts` · `__fixtures__/`
- `api/resultsService.ts` — list (sanitized `.or()` + `.range()`), detail, notes, delete
- `hooks/` — `useWizardState` (flow + draft) · `useWizardController` (dup-save guard) · `savePayload` · `useSaveResult` · `useResultsList` · `useResultDetail` · `useResultMutations`
- `components/` — `DiscChip` · `wizard/` (screens + `result/` sections) · `detail/` (`StoredResultReport` + `storedReportModel` replay)

## Hard constraints

- `public.results` legacy shape frozen until cutover; the legacy app shares the table.
- Anon save = fire-and-forget insert (anon has no SELECT path). NULL-owner rows read-only — UI explains.
- Scoring exact-legacy (ties D>I>S>C, E/S/T/J); golden-master vs the 8 live rows is a hard gate.
- QS option order/`oi` + NvItem ids persist in raw_answers — copy edits need versioning.
- Keys: `queryKeys.profilerResults` only.

## 📚 Related

`docs/03-features/profiler/PROFILER_MODULE.md` · `lib/decisions.md`
