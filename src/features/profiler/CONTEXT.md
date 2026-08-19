# Profiler — Feature Memory

DISC × MBTI profiling (shipped): public wizard `/profiler` (TOOL 01, anonymous-friendly, outside DashboardLayout) + `/profiler-results` LIST + `/:id` DETAIL + convert-to-client bridge. One folder, two module rows (`lib/decisions.md`).

**Two front doors on one route (2026-08-19).** Signed in → the shared tool shell (`@/components/primitives/tools`): `ToolPageHeader` "01 Prospect Profiler" + `ToolCustomerBar`, exactly as tools 04–06 open. Anonymous → `IntakeHero` + `WizardTopBar`, unchanged. The shell shows on the INTAKE screen only; in flow the sticky progress rail is the chrome.

## Map

- `pages/` — ProfilerWizardPage (7 steps + report + auto-save) · ResultsListPage (URL pagination, ilike search) · ResultDetailPage (own-row notes/delete/convert)
- `lib/` — decisions.md · content.ts → content/* (frozen copy) · scoring.ts (exact calcPf/occNudge) · export.ts · print.css · labels.ts · meeting.ts
- `api/` — resultsService · convertService (the clients bridge: findClientByName dedupe + resolveLinkableClientId + INSERT clients → UPDATE results.client_id; ConvertLinkError carries client id) · customerOptionsService (own-book id+name for the picker — twin of crm's, sharing its query KEY but not its code)
- `hooks/` — useWizardState/Controller (owns the `?prospect=` + `?customerId=` entry contract, and now WRITES it via `chooseCustomer`) · savePayload · useSaveResult (re-resolves the link before insert) · useResultsList/Detail/Mutations · useConvertResult (auto/link/create + keyed retry) · useOwnCustomerOptions (the picker's own-book list)
- `components/` — wizard/ · detail/ (StoredResultReport · ConvertResultModal · DuplicateCustomerModal · ResultDetailActions: Convert↔View client)

## Hard constraints

- `public.results` legacy-shape frozen; ONE additive col: nullable client_id (REPORTS_LINK). Anon save = fire-and-forget; NULL-owner rows read-only.
- Convert: OWN rows only (RLS update policy); non-atomic 2-step, retry relinks the kept client id; provenance prefix in client notes; writes public.clients via own api (sanctioned — no crm imports). NEVER inserts blind — a same-name customer in the advisor's book forks to link-vs-create first.
- LINK AT SAVE: entering from a customer sets `client_id` on the insert. "Profiled" is that column and never a name match, so a name-only entry leaves the customer "Never profiled" for good (lib/decisions.md 2026-08-13).
- Scoring exact-legacy (ties D>I>S>C, E/S/T/J); golden-master vs 8 live rows. QS `oi`/NvItem ids frozen.
- Keys: queryKeys.profilerResults only.

## 📚 Related

`docs/03-features/profiler/PROFILER_MODULE.md` · `lib/decisions.md`
