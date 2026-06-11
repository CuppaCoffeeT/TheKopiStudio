# Profiler — Feature Memory

DISC × MBTI prospect-profiling domain: public wizard (`/profiler`, TOOL, anonymous-friendly) + saved results (`/profiler-results` LIST, `/profiler-results/:id` DETAIL). One folder for both surfaces — module rows ≠ folders (see `lib/decisions.md`).

**Status: IN BUILD (P1 scaffold).** Pages are honest stubs on real frame primitives — no data wiring, no scoring lib yet. Filled in by PROFILER_MODULE_PRD phases P2 (lib port) → P3 (wizard) → P4 (results).

## Map

| Dir | Contents |
|---|---|
| `pages/` | `ProfilerWizardPage` (public, WizardShell, own Suspense in App.tsx) · `ResultsListPage` (ListPageFrame) · `ResultDetailPage` (DetailPageFrame) |
| `lib/` | `decisions.md`; P2 adds `content.ts`, `scoring.ts`, `export.ts`, `print.css` + golden-master fixtures |
| `api/` / `hooks/` / `components/` | empty until P3/P4 |
| `types.ts` | flat; re-exports generated `results` row types |

## Hard constraints

- Reads/writes legacy `public.results` byte-compatibly — NO schema/RLS changes this PRD. Legacy app shares the table until cutover.
- Anonymous insert works but anon cannot SELECT back → fire-and-forget save (never `.insert().select()` for anon).
- NULL-owner legacy rows are read-only (no RLS update path) — UI must explain.
- Scoring must replicate legacy `calcPf`/`occNudge` exactly (ties D>I>S>C, E/S/T/J) — golden-master gated.
- Query keys: `queryKeys.profilerResults` only.

## 📚 Related

`docs/05-implementation/active/PROFILER_MODULE_PRD.md` · `lib/decisions.md`
