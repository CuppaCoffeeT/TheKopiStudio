# Profiler — Feature Memory

DISC × MBTI profiling (shipped): public wizard `/profiler` (TOOL, anonymous-friendly, outside DashboardLayout) + `/profiler-results` LIST + `/:id` DETAIL + convert-to-client bridge. One folder, two module rows (`lib/decisions.md`).

## Map

- `pages/` — ProfilerWizardPage (7 steps + report + auto-save) · ResultsListPage (URL pagination, ilike search) · ResultDetailPage (own-row notes/delete/convert)
- `lib/` — decisions.md · content.ts → content/* (frozen copy) · scoring.ts (exact calcPf/occNudge) · export.ts · print.css · labels.ts · meeting.ts
- `api/` — resultsService · convertService (INSERT clients → UPDATE results.client_id; ConvertLinkError carries client id)
- `hooks/` — useWizardState/Controller · savePayload · useSaveResult · useResultsList/Detail/Mutations · useConvertResult (keyed retry)
- `components/` — wizard/ · detail/ (StoredResultReport · ConvertResultModal · ResultDetailActions: Convert↔View client)

## Hard constraints

- `public.results` legacy-shape frozen; ONE additive col: nullable client_id (REPORTS_LINK). Anon save = fire-and-forget; NULL-owner rows read-only.
- Convert: OWN rows only (RLS update policy); non-atomic 2-step, retry relinks the kept client id; provenance prefix in client notes; writes public.clients via own api (sanctioned — no crm imports).
- Scoring exact-legacy (ties D>I>S>C, E/S/T/J); golden-master vs 8 live rows. QS `oi`/NvItem ids frozen.
- Keys: queryKeys.profilerResults only.

## 📚 Related

`docs/03-features/profiler/PROFILER_MODULE.md` · `lib/decisions.md`
