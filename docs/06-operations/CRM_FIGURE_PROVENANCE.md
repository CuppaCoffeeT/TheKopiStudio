# CRM Figure Provenance

**Created**: 2026-08-18 15:45:00 SGT
**Last Updated**: 2026-08-18 15:45:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

Every number the CRM Dashboard (`/crm`) and the Portfolio Report (`/crm-reports`)
print, traced to the table, the columns, the filter and the arithmetic that
produced it — plus the reconciliation run against production on 2026-08-18.

Written because the figures were not trusted. The audit's finding is in two
parts, and the order matters:

1. **No figure is hardcoded, sampled, defaulted or random.** Every one is a live
   RLS-scoped read of `public.*`. The provenance tables below are the receipts.
2. **One figure was nonetheless wrong, and for a reason nobody could see from
   the screen.** The annualised premium silently drops any investment-linked
   policy whose `ilp_premium_inclusion_percent` is 0 — which is the column
   default. On prod that is 4 of 9 live policies and **$12,936 a year**. See
   [Finding 1](#finding-1--the-annual-premium-tile-silently-drops-zero-percent-ilps).

The rest of the perceived mismatch is not a reporting bug at all: the book is
nearly empty and its interaction history is entirely soft-deleted. See
[Findings 2–4](#finding-2--the-live-book-is-3-customers-234-of-237-rows-are-soft-deleted).

---

## CRM Dashboard — `/crm`

Source: [`src/features/crm/api/dashboardService.ts`](../../src/features/crm/api/dashboardService.ts)
→ [`computeDashboardStats`](../../src/features/crm/api/dashboardService.ts).
Rendered by [`CrmDashboardPage`](../../src/features/crm/pages/CrmDashboardPage.tsx).
All three selects are `.limit(5000)` and RLS-scoped: an advisor sees their own
book; a holder of the `view_all_clients` capability sees the firm's.

| Tile | Table | Columns | Filter | Arithmetic |
|---|---|---|---|---|
| **Total clients** | `clients` | `id` | `is_deleted = false` | Row count |
| **Active policies** | `policies` ⋈ `clients` | `status` | `policies.is_deleted = false` AND `clients.is_deleted = false` | Count where `status = 'Active'` |
| **Annual premium** | `policies` ⋈ `clients` | `premium`, `frequency`, `is_investment_linked`, `ilp_premium_inclusion_percent` | same as above | `Σ premium × freqMultiplier × (ILP ? pct/100 : 1)` — see below |
| **Upcoming follow-ups** | `interactions` ⋈ `clients` | `follow_up` | `is_deleted = false` on both, `follow_up IS NOT NULL` | Count where `follow_up > now()` (SG clock) |

**Frequency multiplier** ([`annualisePremium`](../../src/features/crm/lib/finance.ts)):
`Monthly ×12 · Quarterly ×4 · Semi-Annual ×2 · everything else ×1`.

**The ILP scaling** ([`summariseClient`](../../src/features/crm/lib/finance.ts)):
an investment-linked policy contributes only the protection slice of its
premium, `premium × pct/100`. This is the intended rule — the rest of an ILP
premium is investment, not premium revenue.

**Documented divergence from legacy** (`CRM_MODULE_PRD.md`): the legacy
dashboard raw-summed `premium` with no frequency multiplier and no ILP scaling,
while labelling the row "annual". Three different numbers are therefore
defensible for the same book, which is worth knowing before comparing against
an old screenshot:

| Interpretation | Prod, 2026-08-18 |
|---|---|
| Annualised + ILP-scaled (**what the tile shows**) | **$5,689** |
| Annualised, no ILP scaling | $20,425 |
| Legacy raw sum of `premium` | $2,209 |

---

## Portfolio Report — `/crm-reports`

Source: [`src/features/crm/api/portfolioService.ts`](../../src/features/crm/api/portfolioService.ts)
→ [`summarisePortfolio`](../../src/features/crm/lib/financeReportPortfolio.ts).
Two selects, both `.limit(5000)`, same RLS scope as the dashboard.

| Field | Table | Columns | Filter | Arithmetic |
|---|---|---|---|---|
| **Total clients** | `clients` | `id` | `is_deleted = false` | Row count (a client with zero policies still counts — legacy parity) |
| **Total policies** | `policies` ⋈ `clients` | `id` | `is_deleted = false` on both | Row count, all statuses |
| **Active policies** | `policies` ⋈ `clients` | `status` | same | Count where `status = 'Active'` |
| **Total annual premium** | `policies` ⋈ `clients` | as the dashboard tile | same | Identical call to `summariseClient` — the two surfaces cannot disagree |
| **Total coverage** | `policies` ⋈ `clients` | `coverage_amount` | same | `Σ coverage_amount`, no annualisation |
| **Avg annual premium / client** | derived | — | — | `totalAnnualPremium / totalClients`, 0 when the book is empty |
| **Avg coverage / client** | derived | — | — | `totalCoverage / totalClients`, 0 when the book is empty |
| **Per-client facts** | `clients` | `name`, `email`, `phone`, `occupation`, `annual_income`, `risk_profile` | `is_deleted = false`, ordered by `name` | Renamed only — no arithmetic |
| **Per-client policy rows** | `policies` | `type`, `provider`, `policy_number`, `premium`, `frequency`, `coverage_amount`, `status` | `is_deleted = false` | **RAW per-frequency premium**, printed as "X/frequency" (legacy `Reports.jsx:147-149`) — deliberately NOT annualised at row level, while the total above it IS |

---

## Reconciliation against production, 2026-08-18

Run through the Supabase MCP against project `mymzcbalyqqgdmzsfmam`,
re-implementing each figure's arithmetic in SQL and comparing to the code path.

| Figure | SQL | Verdict |
|---|---|---|
| Total clients (whole firm) | 3 | ✅ matches |
| Total policies (live) | 9 | ✅ matches |
| Active policies | 9 | ✅ matches |
| Annual premium | $5,689 | ✅ matches the code — ⚠️ but see Finding 1 |
| Upcoming follow-ups | 0 | ✅ matches — ⚠️ but see Finding 3 |

---

## Finding 1 — the annual-premium tile silently drops zero-percent ILPs

`ilp_premium_inclusion_percent` **defaults to `0`** in both the column
(`policies.ilp_premium_inclusion_percent DEFAULT 0`) and the form model
([`policyFormModel.ts`](../../src/features/crm/components/modals/policy/policyFormModel.ts)).
Any ILP saved without someone deliberately setting that percent is therefore
multiplied by zero and contributes **nothing** to the annual-premium figure —
with no indication on screen that anything was left out.

On prod, on the one customer with a real portfolio:

| Provider | Premium | Freq | ILP % | Contribution |
|---|---|---|---|---|
| HSBCLife FlexiProtect | $300 | Monthly | 50 | $1,800 |
| Manulife Smartretire16 | $300 | Monthly | **0** | **$0** |
| HSBCLife Pulsar | $250 | Monthly | **0** | **$0** |
| Manulife Retireready20 | $378 | Monthly | **0** | **$0** |
| AIA Familyfirst | $150 | Monthly | **0** | **$0** |

**$12,936 a year, invisible.** The tile read $5,689 and the advisor had no way
to find out why.

**What was changed, and what was not.** The math is **untouched**. A 0 percent
is genuinely ambiguous — on this very customer a sibling ILP carries a
deliberate 50, so the field is in real use, and re-including zero-percent ILPs
at 100% would inflate every book that has filled it in correctly. Quietly
changing a money figure is also precisely what this audit was asked not to do.

Instead the omission is now **declared**
([`lib/ilpExclusion.ts`](../../src/features/crm/lib/ilpExclusion.ts)):

- the Annual premium tile's subtitle names the count of excluded policies;
- the Portfolio Report's premium row does the same, in print;
- `ilpExclusion.test.ts` pins the prod case at 4 policies / $12,936.

**Action for the advisor**: open each of those four policies and set a real
premium-inclusion percent. The figures correct themselves; nothing needs a code
change to make that happen.

## Finding 2 — the live book is 3 customers; 234 of 237 rows are soft-deleted

| Table | Rows | Soft-deleted | Live |
|---|---|---|---|
| `clients` | 237 | 234 | **3** |
| `policies` | 230 | 221 | **9** |
| `interactions` | 94 | 94 | **0** |

233 of the 234 deleted customers belong to `skytwech+e2e-advisor@gmail.com` —
E2E fixture churn, not lost data. The remaining live book is 2 customers for
Keane and 1 for Sky. **The CRM import has not landed.** Every dashboard figure
being small is the data being small, not the query being wrong.

## Finding 3 — "Upcoming follow-ups" is structurally 0

All 94 `interactions` rows are soft-deleted, so `follow_up > now()` can never
match. The same absence means the Overview's "no contact in 14 days" rule reads
**every** customer as never contacted, because `lastContactDate` comes from
`interactions.date`.

This is a data state, not a bug — but it is the state that makes two separate
surfaces look broken at once, so it belongs on this page.

## Finding 4 — no customer has a review date

`next_review_date` is `NULL` on all 3 live customers, so the Overview's
"Reviews coming up" band is structurally empty regardless of the window.

---

## 📚 Related Documentation

- [docs/05-implementation/completed/CRM_MODULE_PRD.md](../05-implementation/completed/CRM_MODULE_PRD.md) — the annualisation divergence from legacy, as originally decided
- [docs/03-features/crm/CRM_MODULE.md](../03-features/crm/CRM_MODULE.md) — the CRM module as-built
- [docs/01-system-architecture/SUPABASE_QUERY_STANDARDS.md](../01-system-architecture/SUPABASE_QUERY_STANDARDS.md) — the `.limit()` bounds every select here uses
- [src/features/crm/lib/ilpExclusion.ts](../../src/features/crm/lib/ilpExclusion.ts) — Finding 1's implementation and its reasoning
- [src/features/crm/lib/decisions.md](../../src/features/crm/lib/decisions.md) — feature-local decision log
