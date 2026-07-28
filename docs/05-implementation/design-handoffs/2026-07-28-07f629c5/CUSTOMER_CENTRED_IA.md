# Customer-Centred IA — handoff → build map

**Source**: Claude Design project `c59d3b3e-810d-4963-a671-ba7907f629c5`, file
`Kopi Studio Directions.dc.html` (staged verbatim beside this note).
**Staged / built**: 2026-07-28. **Ask**: "update the app so that it is more customer focused."

The handoff carries three turns. Turn 2 is the 2a visual direction already shipped
(see `../2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md`). Turns **3a** and **4a** are the
information-architecture change this build implements.

## The argument (turn 3a, verbatim)

> The sidebar drops to two destinations — Overview and Customers. Tools are no longer
> navigation; they are things you do to a customer, launched from the customer record.
> Overview becomes an action queue: who has gone quiet, who is mid-profiler, what is overdue.

Turn 4a adds three things on top: an Overview launcher band, a fork on "new customer"
(profile them / create an empty profile), and a manager-only Reports destination.

## Comp → code

| Comp surface | Built as | Notes |
|---|---|---|
| Rail: Overview · Customers | `primitives/shell/AppSidebar` | Other granted modules DEMOTED under a "More" hairline, not deleted — see deviations |
| Overview launcher band | `crm/components/StartProfilerBand` | Gated on holding `/profiler` |
| Overview four figures | `crm/components/QueueStatStrip` | quiet · unfinished · reviews due · added this month |
| Overview queue bands | `crm/components/CustomerQueueSection` ×3 | Mutually exclusive: one reason per customer |
| Customers list + checklist | `crm/pages/ClientsListPage` + `JourneyChecklist` | Checklist signals are page-scoped (`useCustomerSignals`) |
| Customer tool launcher | `crm/components/detail/CustomerToolLauncher` | 01 Profiler · 02 Information · 03 Report |
| "Two ways to add someone" | `crm/components/modals/AddCustomerChoiceModal` | Reuses the `ChoiceCards` primitive |
| Queue rule / step rules | `crm/lib/customerJourney` | Pure, `refDate`-injected, 28 unit tests |

One ruleset backs all three surfaces. A list row can therefore never disagree with the
record it opens — that was the whole point of centralising it.

## Deviations from the comp (deliberate, with reasons)

1. **The rail demotes rather than deletes.** Saved profiler results can exist with no
   customer attached (the public `/profiler` wizard creates exactly that), so dropping
   `/profiler-results` from navigation would strand real records behind a URL.
2. **No "step 4 of 7 · resume profiler".** `public.results` saves one row on completion
   and persists no partial run, so the profiler step is binary. Rendering a resume
   affordance that cannot resume would be a lie the schema can't back.
3. **Report `done` means *ready to generate*.** There is no issued flag on any table.
   `locked` — the comp's real rule, "needs steps 01 and 02" — renders NO action rather
   than a clickable lock.
4. **The manager Reports destination is NOT built.** It needs a cross-advisor roster
   surface that does not exist yet, and the existing `/crm-reports` is a different
   artifact (a book-wide financial summary, currently granted to advisors too).
   Building it means a new module row + grants, i.e. a DB migration.
5. **Gone-quiet rows are marked, not tinted.** The comp tints the whole row; `DataTable`
   has no per-row surface API, and the "Last contact" danger badge carries the same
   information without surgery on a shared primitive.

## Closed by this build

`/clients/:id/report` had **no entry point anywhere in the app** — the client report was
reachable only by typing the URL. Step 03 of the launcher is now that entry point.

## Related

- `src/features/crm/lib/decisions.md` — the three dated decision entries for this change
- `src/features/crm/CONTEXT.md` — the feature map + the journey-purity constraint
- `tests/workflows/crm/dashboard.spec.ts` — the re-pointed Overview seatbelt
