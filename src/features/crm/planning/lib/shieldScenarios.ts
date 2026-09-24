/**
 * Shield claim scenarios — the advisor's own worked examples and their copy,
 * verbatim from `shield-comparison.html`. Bill amounts are illustrative; use
 * the client's actual hospital quote. Arithmetic: `shieldClaims.ts`.
 */

import { NO_CAP, type CancerScenario, type EverydayScenario } from './shieldClaims';

export const EVERYDAY_SCENARIOS: readonly EverydayScenario[] = [
  {
    title: 'Diagnostic colonoscopy, private day surgery',
    bill: 3000,
    singlifeDeductible: 2000,
    incomeDeductible: 3500,
    covered: true,
    note: 'Income pays nothing. Its day surgery deductible of $3,500 is larger than the whole bill, so there is no claimable amount left. Singlife’s $2,000 leaves $1,000 to claim. A colonoscopy done purely as health screening is excluded by both — it must be diagnostic. Income alone carves back surveillance screening for a client with a cancer history.',
  },
  {
    title: 'Colonoscopy with polypectomy',
    bill: 5000,
    singlifeDeductible: 2000,
    incomeDeductible: 3500,
    covered: true,
    note: 'Removing a polyp turns a scope into a surgical procedure, so it sits in the MOH surgical table and is claimable on both. Once the bill clears both deductibles the gap narrows to the $1,500 difference between them.',
  },
  {
    title: 'Cataract surgery, one eye, private',
    bill: 8000,
    singlifeDeductible: 2000,
    incomeDeductible: 3500,
    covered: true,
    note: 'Only monofocal non-toric standard lenses are covered. Clients pay thousands out of pocket for the multifocal upgrade without being told. If the second eye is done in the same policy year the deductible is already spent; across two policy years they pay it twice. Worth timing deliberately.',
  },
  {
    title: 'Second day surgery in the same policy year',
    bill: 3000,
    singlifeDeductible: 0,
    incomeDeductible: 0,
    covered: true,
    note: 'The same $3,000 colonoscopy, later in the same year, after the deductible has already been paid on an earlier claim. This is the single most useful thing you can teach a client about how their plan behaves.',
  },
  {
    title: 'A&E visit, treated and sent home',
    bill: 500,
    singlifeDeductible: 0,
    incomeDeductible: 0,
    covered: false,
    note: 'Neither plan covers a standalone A&E visit. Singlife covers A&E only as pre-hospital treatment within 24 hours before an admission; Income only as pre-hospitalisation leading to a stay, and its exclusion (d) rules out general outpatient expenses.',
  },
  {
    title: 'A&E visit that leads to admission',
    bill: 12500,
    singlifeDeductible: 3500,
    incomeDeductible: 3500,
    covered: true,
    note: 'Now the A&E charge is claimable as pre-hospital treatment attached to the admission, and the inpatient deductible applies rather than the day surgery one. Both insurers treat an admission from the emergency department in the same visit as a panel claim, so the cap survives even though nobody chose the doctor.',
  },
];

export const OFF_PANEL_SCENARIOS: readonly { title: string; bill: number }[] = [
  { title: 'Colonoscopy with polypectomy, off panel', bill: 5000 },
  { title: 'Cataract surgery, one eye, off panel', bill: 8000 },
  { title: 'Private hospital admission, off panel', bill: 150000 },
];

export const CANCER_SCENARIOS: readonly CancerScenario[] = [
  {
    title: 'Standard chemotherapy',
    cost: 36000,
    months: 12,
    mshlLimit: 800,
    onDrugList: true,
    topUpDeductible: 5000,
    planDeductible: 0,
    incomeCap: 6000,
    note: '$3,000 a month. Both plans cover it several times over and the client pays only the co-payment. This is what most cancer treatment actually looks like.',
  },
  {
    title: 'Immunotherapy at private-hospital prices',
    cost: 195000,
    months: 12,
    mshlLimit: 2000,
    onDrugList: true,
    topUpDeductible: 5000,
    planDeductible: 0,
    incomeCap: 6000,
    note: 'Immunotherapy runs about $9,000 a dose every two to three weeks — roughly $13,000 to $19,500 a month. This sits in the middle at $16,250. Pembrolizumab, nivolumab, atezolizumab and durvalumab all carry a $2,000 MediShield limit, so Singlife covers $20,000 a month and Income $46,000. Both cover the bill. Income’s extra headroom is insurance against the expensive tail, not a gap you can show a client today.',
  },
  {
    title: 'Drug not on the Cancer Drug List',
    cost: 156000,
    months: 12,
    mshlLimit: 0,
    onDrugList: false,
    topUpDeductible: 10000,
    planDeductible: 0,
    incomeCap: NO_CAP,
    singlifeCover: 10000,
    incomeCover: 15000,
    incomeRate: 0.1,
    singlifeCap: NO_CAP,
    note: '$13,000 a month for a drug off the list. No base plan pays anything — the rider carries it alone, $10,000 a month on Singlife against $15,000 on Income. Neither caps the co-payment here, but Singlife charges 5% against Income’s 10%. This is now the clearest cancer gap between the two.',
  },
  {
    title: 'CAR-T cell therapy, one-off',
    cost: 600000,
    months: 1,
    mshlLimit: 0,
    onDrugList: false,
    topUpDeductible: 145000,
    planDeductible: 3500,
    incomeCap: NO_CAP,
    singlifeCover: 150000,
    incomeCover: 250000,
    incomeRate: 0.05,
    singlifeCap: 6000,
    note: 'The only scenario where the standalone top-up earns its premium, and it is rare in adults — but not in children. Kymriah’s lead indication is paediatric B-cell leukaemia, so weigh this differently for a child. Income’s co-payment is uncapped here: Optima clause 1.1a removes the $6,000 cap on any claim that reaches a benefit limit, and $600,000 passes its $250,000 cell therapy limit.',
  },
];
