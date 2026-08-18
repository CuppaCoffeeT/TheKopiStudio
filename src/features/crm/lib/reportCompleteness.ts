/**
 * Report completeness — what a client report is MISSING, and who fills it.
 *
 * WHY THIS EXISTS (2026-08-18): the report used to be gated. Tool card 03 stayed
 * locked until the profiler and the customer information were both complete, so
 * the one artifact an advisor can put in front of a customer was unavailable
 * exactly when it would have been most useful — at the first meeting, as the
 * thing that shows what is still unknown.
 *
 * The gate is gone. The report now always generates, and this module supplies
 * the honest replacement: a named list of what is blank and which tool fills
 * it, printed at the top of the report. An empty field reads `NIL`, never a
 * silent blank and never a fabricated zero — `$0 income` and `income unknown`
 * are different facts, and a report that confuses them is worse than no report.
 *
 * Pure: takes a model and returns strings. No React, no queries.
 */

import type { CrmClient, CrmPolicy } from '../types';

/** The placeholder for a field with nothing on file. */
export const NIL = 'NIL';

/** A value, or `NIL` when the record holds nothing for it. */
export function nilOr(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? NIL : trimmed;
}

/** A money value, or `NIL` — a blank income must never print as `$0`. */
export function nilMoney(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return NIL;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? `$${parsed.toLocaleString('en-SG')}` : NIL;
}

/** One gap, and the tool that closes it. */
export interface ReportGap {
  field: string;
  /** The sentence printed under the report's missing-information heading. */
  remedy: string;
}

const PROFILER_REMEDY = 'Complete the Prospect Profiler to populate this section.';
const INFO_REMEDY = 'Add it to the customer information.';
const POLICY_REMEDY = 'Add their policies to populate the portfolio sections.';

/**
 * Everything the report could not fill, in the order it appears in the report.
 *
 * Deliberately NOT the same list as `customerJourney`'s `INFO_CHECK_COUNT`
 * checks: that one answers "is this record complete enough to count as done?"
 * for the work queue, and it is allowed to be opinionated. This one answers
 * "what did the report have to print NIL for?", which is a fact about the
 * rendered document — the two would drift the moment either question changed.
 *
 * @param hasProfile whether a profiler result is LINKED to this customer.
 *   Passed in rather than inferred from `client.riskProfile`, because the add
 *   form defaults that column to 'Moderate' — so a customer nobody has ever
 *   profiled still arrives here carrying a risk profile, and inferring from it
 *   would report a completed profiler for every new record. `results.client_id`
 *   is the app's single definition of "profiled" (lib/customerJourney); this
 *   uses the same one.
 */
export function reportGaps(
  client: CrmClient,
  policies: readonly CrmPolicy[],
  hasProfile: boolean,
): ReportGap[] {
  const gaps: ReportGap[] = [];

  if (!hasProfile) gaps.push({ field: 'Risk profile', remedy: PROFILER_REMEDY });
  else if (!client.riskProfile.trim())
    gaps.push({ field: 'Risk profile', remedy: 'Set it on the customer information.' });
  if (!client.dateOfBirth.trim())
    gaps.push({ field: 'Date of birth', remedy: `${INFO_REMEDY} Age and retirement horizon read from it.` });
  if (!client.annualIncome.trim()) gaps.push({ field: 'Annual income', remedy: INFO_REMEDY });
  if (!client.occupation.trim()) gaps.push({ field: 'Occupation', remedy: INFO_REMEDY });
  if (!client.email.trim() && !client.phone.trim())
    gaps.push({ field: 'Contact details', remedy: INFO_REMEDY });
  if (policies.length === 0) gaps.push({ field: 'Portfolio', remedy: POLICY_REMEDY });
  if (
    !client.cpfOA.trim() &&
    !client.cpfSA.trim() &&
    !client.cpfMA.trim()
  )
    gaps.push({ field: 'CPF balances', remedy: `${INFO_REMEDY} The CPF projection needs them.` });

  return gaps;
}
