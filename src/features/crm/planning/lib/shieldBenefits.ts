/**
 * Shield benefit comparison — every benefit line, from the policy contracts
 * rather than the brochures. Verbatim from `shield-comparison.html`.
 */

export interface BenefitRow {
  area: string;
  benefit: string;
  singlife: string;
  income: string;
  why: string;
}

const ROWS: readonly (readonly [string, string, string, string, string])[] = [
  ['Money', 'Annual deductible, private ward, age 80 and below', '$3,500', '$3,500', 'Same. Never covered by a rider.'],
  ['Money', 'Annual deductible, day surgery not subsidised', '$2,000', '$3,500', 'Singlife is $1,500 cheaper on a common claim type.'],
  ['Money', 'Co-payment with rider, panel', '5%, capped $6,000 a year', '5%, capped $6,000 a year', 'Same. Worst case on panel is roughly $3,500 + $6,000.'],
  ['Money', 'Co-payment with rider, off panel', '5%, no cap', '8%, no cap', 'Both drop the cap off panel. Singlife charges 3 points less.'],
  ['Money', 'Does the cap survive a very large claim?', 'Yes. No carve-out in the contract.', 'No. On any claim that reaches a special benefit limit or the annual limit, the co-payment stops counting towards the $6,000.', 'Optima Care clause 1.1a. It bites exactly when the bill is catastrophic — see Cancer Scenario 4.'],
  ['Money', 'Admitted to hospital from A&E', 'Treated as A&E, so the cap applies', 'Treated as a panel claim, so the cap applies', 'Same outcome. Useful to know for an emergency admission with an unknown doctor.'],
  ['Money', 'Extended panel tier', 'None published', '8%, and the $6,000 cap still applies', 'A route for a client attached to a specific surgeon.'],
  ['Money', 'Co-insurance without any rider', '10%, capped $25,500 a year', '10%, no cap', 'Only affects clients who decline the rider.'],
  ['Money', 'Waiver on death', '$10,000', '$5,000, and also waives outpatient co-insurance within 30 days', 'Singlife pays more; Income reaches wider.'],
  ['Limits', 'Annual limit', '$2,000,000 on panel, $1,000,000 off panel', '$1,500,000, panel or not', 'Singlife\'s higher headline flips below Income the moment the client goes off-panel.'],
  ['Limits', 'Lifetime limit', 'Unlimited', 'Unlimited', 'Same.'],
  ['Limits', 'Pro-ration at a private hospital', 'None', 'None', 'Both pay the private bill in full at this tier.'],
  ['Cancer', 'CDL drugs, plan only', '5x MediShield Life limit per month', '5x MediShield Life limit per month', 'Set by MOH. Identical.'],
  ['Cancer', 'CDL drugs, total cover', '5x the MediShield Life limit + $10,000 flat', '5x + 18x = 23x the MediShield Life limit', 'At a $2,000 limit — the median drug, and pembrolizumab\'s — Singlife covers $20,000 a month, Income $46,000. Immunotherapy runs $13,000-$19,500 a month, so both cover it. Income\'s extra is tail insurance.'],
  ['Cancer', 'CDL co-payment off panel', '5%, no cap', '5%, no cap', 'Same. Both drop the cap once the doctor is off panel.'],
  ['Cancer', 'Cancer drug services co-payment', '5%, capped on panel', '5%, capped on panel; no cap off panel', 'Same shape on both.'],
  ['Cancer', 'Non-CDL drugs, with rider', '$10,000 a month', '$15,000 a month', 'Income reaches further.'],
  ['Cancer', 'Non-CDL co-payment', '5%, and the $6,000 cap does not apply', '10%, and the $6,000 cap does not apply', 'Neither caps it. Contract H58.01 footnote 2 and Income footnote (v) both exclude non-CDL from the annual maximum. Singlife charges half the rate.'],
  ['Cancer', 'Proton beam therapy', '$70,000 a year', '$100,000 a year', 'Income $30,000 more.'],
  ['Cancer', 'CAR-T on the MOH list', '$150,000 each', '$250,000 each', 'Income $100,000 more. Decisive in Scenario 4.'],
  ['Cancer', 'Gene therapy NOT on the MOH list', 'Excluded', 'Rider covers up to $150,000, 10% co-payment, no cap', 'Singlife has nothing here.'],
  ['Cancer', 'Extra inpatient cover for major cancer', '$150,000 a year on top of the annual limit', 'None', 'Lifts Singlife\'s ceiling to $2.15m for a cancer admission.'],
  ['Cancer', 'Cash benefit on diagnosis', '$10,000 once, but only if the life assured is past their first birthday and not older than 65', 'None for adults', 'Money in hand, but it switches off at 65 — the years the client is most likely to claim.'],
  ['Cancer', 'Recovery support after treatment', '$20,000 lifetime, up to 730 days, but ONLY if the client also holds CareShield or ElderShield Standard/Plus and is certified for the Severe Disability Benefit', 'None', 'Far narrower than the brochure suggests. Most clients will never meet the severe disability test. Do not present it as general post-cancer support.'],
  ['Cancer', 'Surveillance screening after a cancer history', 'Excluded', 'Covered when a doctor orders it', 'Survivors live on scans for years. Not in either brochure — it is in Income\'s exclusions.'],
  ['Cancer', 'Genetic testing to guide treatment', 'Not addressed', 'Covered when ordered to determine treatment', 'Decides whether a client qualifies for a targeted drug at all.'],
  ['Hospital', 'Pre-hospitalisation, panel', '180 days', '180 days', 'Same.'],
  ['Hospital', 'Pre-hospitalisation, off panel', '90 days', '100 days', 'Income 10 days more.'],
  ['Hospital', 'Post-hospitalisation, panel', '365 days', '365 days', 'Same.'],
  ['Hospital', 'Post-hospitalisation, off panel', '180 days', '180 days with the rider', 'Same destination, different route.'],
  ['Hospital', 'Community hospital', 'As charged, no day cap', 'As charged, up to 90 days per admission', 'Matters for stroke and frailty rehab.'],
  ['Hospital', 'Inpatient psychiatric', 'As charged up to 60 days a year', 'As charged up to $20,000 a year', 'Days versus dollars. At private rates $20,000 runs out fast.'],
  ['Hospital', 'Outpatient mental health', '$100 a visit, up to $1,000 a year', 'None', 'The only outpatient mental health cover on either side.'],
  ['Hospital', 'Prosthesis after losing a limb or eye', 'Not covered', '$10,000 a year, no deductible, no pro-ration', 'One of very few benefits that escapes the deductible.'],
  ['Hospital', 'Ambulance or transport to hospital', '$80 per injury or illness', 'Not covered', 'Small, but it is a bill clients actually get.'],
  ['Hospital', 'Post-hospital TCM follow-up', '$50 a visit, up to 180 days after discharge, accident admissions only', 'Not covered', 'Narrow, but TCM is the first thing many clients reach for after an accident.'],
  ['Hospital', 'Extra critical illness cash for kidney failure', '$3,000 lifetime, if dialysis is at a public hospital or subsidised centre', 'None', 'Only pays if the client uses the subsidised route.'],
  ['Family', 'Accidental cover for a child', '$1,000 lifetime, once only', 'None', 'Token amount. Mention it, do not sell on it.'],
  ['Hospital', 'Named outpatient support benefits', 'Not itemised', 'Seven named benefits, restructured hospitals only', 'Long list, but a private-tier client may never use them.'],
  ['Overseas', 'Emergency overseas treatment', 'Covered, pegged to Singapore private costs', 'Covered, pegged to Singapore private costs', 'Same.'],
  ['Overseas', 'Planned overseas treatment', 'Covered via a Medisave-accredited referral', 'Not covered', 'Income\'s exclusion (f) is explicit.'],
  ['Family', 'Child cover under the rider', 'Free child cover to age 20 — but the free cover is Plan 2 PUBLIC, not Private', 'None', 'Worth nothing if you are placing the child on Plan 1 Private. Do not count it in a private-tier comparison.'],
  ['Family', 'Free newborn benefit', '$50,000 a year to age 6 months, both parents on Plan 1 or 2 for 10 months', 'None', 'Short window, but genuinely free.'],
  ['Family', 'Extra bed for a parent with a warded child', '$80 a day, up to 10 days (child under 19)', '$80 a day, up to 10 days', 'Same on both.'],
  ['Family', 'Critical care benefit for children', 'None', '$50,000 once, needs 4+ days in ICU or HDU', 'Under-18s only.'],
  ['Admin', 'Guaranteed renewal for life', 'Yes', 'Yes', 'Both. But neither guarantees the premium.'],
  ['Admin', 'Underwriting route', 'Full medical declaration', 'Full medical declaration', 'Same. Singlife\'s 5-year moratorium option is closed to new business and applies only to legacy policyholders.'],
  ['Admin', 'Plan tiers available', 'Three', 'Four', 'Income has a cheaper tier to downgrade into.'],
  ['Admin', 'Claim window', '90 days', '90 days', 'Same.'],
  ['Admin', 'Premium grace period', '60 days', '60 days', 'Same.'],
  ['Admin', 'Disputes', 'Singapore courts', 'FIDReC, then arbitration', 'Different routes. Neither is better in the abstract.'],
  ['Admin', 'No Claims Discount', '20% off the Health Plus rider', 'No NCD schedule in the documents held', 'Quote standard rates first on both sides.'],
  ['Top-up', 'Cancer Cover Plus II', 'Can be added', 'Can be added', 'Not a Singlife rider. Eligibility is only Singapore Citizen or PR, entry age 75. It sits on either plan.'],
];

export const BENEFIT_ROWS: readonly BenefitRow[] = ROWS.map(
  ([area, benefit, singlife, income, why]) => ({ area, benefit, singlife, income, why }),
);

/** Areas in first-appearance order. */
export const BENEFIT_AREAS: readonly string[] = [...new Set(ROWS.map((row) => row[0]))];
