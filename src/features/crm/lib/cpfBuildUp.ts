/**
 * v42 (2026-09-25) — the CPF inputs a customer record carries, and the
 * "how it builds up" waterfall the report prints under the projection.
 *
 * Split from `cpfContributions.ts` (200-LOC ceiling) along a real seam: that
 * file SIMULATES; this one reads the record into the simulation's input and
 * explains its output. Pure; the report component only formats.
 */

import type { CpfWithContributionsInput, CpfWithContributionsProjection } from './cpfContributions';
import { incomeStepsFromClient } from './incomeSteps';
import { toFloat } from './finance';

type ClientCpfFields = Parameters<typeof incomeStepsFromClient>[0] & {
  avgAnnualIncomeTo55?: string | number | null;
  cpfHousingMonthly?: string | number | null;
  cpfHousingEndAge?: string | number | null;
};

export type IncomeBasis = 'tiers' | 'average' | 'none';

export interface ClientCpfPlan
  extends Pick<CpfWithContributionsInput, 'incomeSteps' | 'avgIncomeTo55' | 'housing'> {
  /** What the contributions were projected from — tiers win over the average. */
  incomeBasis: IncomeBasis;
}

/**
 * The record's income tiers, v42 average-income fallback and housing loan.
 * Housing end age: blank ⇒ null ⇒ the loan runs until 55 (v42 `|| 55`).
 */
export function cpfPlanFromClient(client: ClientCpfFields): ClientCpfPlan {
  const incomeSteps = incomeStepsFromClient(client);
  const avgIncomeTo55 = toFloat(client.avgAnnualIncomeTo55);
  const monthly = toFloat(client.cpfHousingMonthly);
  const endAge = parseInt(String(client.cpfHousingEndAge ?? ''), 10);
  return {
    incomeSteps,
    avgIncomeTo55,
    housing: monthly > 0 ? { monthly, endAge: Number.isFinite(endAge) ? endAge : null } : undefined,
    incomeBasis: incomeSteps.length > 0 ? 'tiers' : avgIncomeTo55 > 0 ? 'average' : 'none',
  };
}

export interface CpfBuildUpLine {
  start: number;
  contributions: number;
  /** OA only: the housing drain (positive number, printed as a deduction). */
  housing: number;
  /** SA only: the Medisave-overflow boost. */
  overflow: number;
  /** Derived so the column reconciles; floored at 0 for display (v42). */
  interest: number;
  at55: number;
}

/**
 * v42 waterfall: starting balance + contributions − housing (+ overflow) +
 * interest = value at 55. Interest is DERIVED from the other lines, exactly
 * like the reference, so every line is a real event and they add up.
 */
export function cpfBuildUp(
  start: { cpfOA: number; cpfSA: number },
  p: CpfWithContributionsProjection,
): { oa: CpfBuildUpLine; sa: CpfBuildUpLine } {
  const oaInterest = p.oaAt55 - start.cpfOA - p.totalContributedToOA + p.totalHousingDeducted;
  const saOverflow = p.totalOverflow > 0 ? p.saBoostFromOverflow : 0;
  const saInterest = p.saAt55 - start.cpfSA - p.totalContributedToSA - saOverflow;
  return {
    oa: {
      start: start.cpfOA,
      contributions: p.totalContributedToOA,
      housing: p.totalHousingDeducted,
      overflow: 0,
      interest: Math.max(0, oaInterest),
      at55: p.oaAt55,
    },
    sa: {
      start: start.cpfSA,
      contributions: p.totalContributedToSA,
      housing: 0,
      overflow: saOverflow,
      interest: Math.max(0, saInterest),
      at55: p.saAt55,
    },
  };
}
