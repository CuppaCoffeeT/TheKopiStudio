/**
 * The relief catalogue and the full tax assessment.
 *
 * Ported from `sg_tax_calculator.html`. The reference builds its rows from one
 * declarative list and then recomputes everything on every keystroke; this
 * keeps that shape, because the list IS the spec — adding a relief should mean
 * adding one entry, never touching the maths.
 *
 * The assessment that consumes this catalogue lives in `taxAssessment.ts`.
 */

/**
 * How a relief's amount is arrived at.
 * - `auto`     computed from age/income (the user only toggles it)
 * - `fixed`    a flat statutory amount
 * - `quantity` a flat amount per dependant
 * - `wmcrFixed` / `wmcrPercentage` the two Working Mother's Child Relief regimes
 * - `manual`   the user types the amount, optionally capped
 */
export type ReliefKind = 'auto' | 'fixed' | 'quantity' | 'wmcrFixed' | 'wmcrPercentage' | 'manual';

export interface ReliefDefinition {
  id: string;
  name: string;
  hint: string;
  kind: ReliefKind;
  /** `fixed` / `quantity`: the statutory amount (per dependant for `quantity`). */
  standardAmount?: number;
  /** `quantity` / WMCR: how many dependants may be claimed. */
  maxQuantity?: number;
  /** `manual`: the statutory ceiling on what may be typed. */
  cap?: number;
  /** Defaults to on — the three auto reliefs, which always apply. */
  defaultOn?: boolean;
  /** Earned Income Relief cannot be switched off. */
  locked?: boolean;
  /** Only meaningful for the employed. */
  employedOnly?: boolean;
  /** Only meaningful for the self-employed. */
  selfEmployedOnly?: boolean;
}

/** The catalogue, in the order the reference tool lists it. */
export const RELIEFS: readonly ReliefDefinition[] = [
  { id: 'eir', name: 'Earned Income Relief', hint: 'Auto: $1,000 under 55 · $6,000 at 55–59 · $8,000 at 60+', kind: 'auto', defaultOn: true, locked: true },
  { id: 'cpfEmp', name: 'CPF Relief', hint: 'Auto from salary and age (employee contributions)', kind: 'auto', defaultOn: true, employedOnly: true },
  { id: 'cpfSE', name: 'MediSave (Self-Employed)', hint: 'Auto: age-banded rate on net trade income, capped', kind: 'auto', defaultOn: true, selfEmployedOnly: true },
  { id: 'parent', name: 'Parent Relief', hint: '$9,000 each, up to 2 dependants', kind: 'quantity', standardAmount: 9_000, maxQuantity: 2 },
  { id: 'hParent', name: 'Handicapped Parent Relief', hint: '$14,000 each, up to 2', kind: 'quantity', standardAmount: 14_000, maxQuantity: 2 },
  { id: 'spouse', name: 'Spouse Relief', hint: '$2,000 — spouse income ≤ $4,000', kind: 'fixed', standardAmount: 2_000 },
  { id: 'hSpouse', name: 'Handicapped Spouse Relief', hint: '$5,500', kind: 'fixed', standardAmount: 5_500 },
  { id: 'qcr', name: 'Qualifying Child Relief', hint: '$4,000 per child', kind: 'quantity', standardAmount: 4_000, maxQuantity: 8 },
  { id: 'hcr', name: 'Handicapped Child Relief', hint: '$7,500 per child', kind: 'quantity', standardAmount: 7_500, maxQuantity: 8 },
  { id: 'wmcrNew', name: "Working Mother's Child Relief", hint: 'Children born/adopted from 2024: $8k / $10k / $12k per child', kind: 'wmcrFixed', maxQuantity: 8 },
  { id: 'wmcrOld', name: "Working Mother's Child Relief (pre-2024)", hint: '15% / 20% / 25% of earned income per child', kind: 'wmcrPercentage', maxQuantity: 8 },
  { id: 'gcg', name: 'Grandparent Caregiver Relief', hint: '$3,000 — working mothers only', kind: 'fixed', standardAmount: 3_000 },
  { id: 'nsSelf', name: 'NSman Relief (Self)', hint: '$3,000 typical (up to $5,000 with key appointment)', kind: 'fixed', standardAmount: 3_000 },
  { id: 'nsWife', name: 'NSman Wife Relief', hint: '$750', kind: 'fixed', standardAmount: 750 },
  { id: 'nsParent', name: 'NSman Parent Relief', hint: '$750', kind: 'fixed', standardAmount: 750 },
  { id: 'fdwl', name: 'Foreign Domestic Worker Levy', hint: '2× levy paid — married women / specific cases', kind: 'manual' },
  { id: 'cpfTopSelf', name: 'CPF Cash Top-up (Self)', hint: 'Max $8,000', kind: 'manual', cap: 8_000 },
  { id: 'cpfTopFam', name: 'CPF Cash Top-up (Family)', hint: 'Max $8,000', kind: 'manual', cap: 8_000 },
  { id: 'srs', name: 'SRS Contributions', hint: 'Max $15,300 for citizens / PRs', kind: 'manual', cap: 15_300 },
];
