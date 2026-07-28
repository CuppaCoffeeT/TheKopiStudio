/**
 * Customer queue API — the read behind the Overview action queue
 * (customer-centred IA; Kopi Studio Directions turn 4a, "Overview — start a
 * profiler, then the queue").
 *
 * Three bounded selects over the viewer's RLS-visible book, joined in memory:
 * the customers themselves, the newest interaction per customer, and which
 * customers have a linked profiler result. Doing the join here rather than in
 * PostgREST keeps every filter in ONE pure place (`lib/customerJourney`) that
 * the Customers list and the customer detail launcher also read — a second
 * server-side definition of "gone quiet" is how those three surfaces start
 * disagreeing.
 *
 * `results` is read from this feature on purpose: the merge plan sanctions an
 * own-feature api hitting shared tables, and importing profiler's
 * `resultsService` would be a cross-feature drift error (same sanction as
 * `linkedResultsService`). RLS prunes both sides, so a customer whose profile
 * belongs to another advisor simply reads as un-profiled — the neutral,
 * indistinguishable result the REPORTS_LINK_PRD asks for.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentSingaporeTime, getLocalDateString } from '@/utils/timezoneUtils';
import {
  deriveAttention,
  describeAttention,
  type CustomerAttention,
} from '../lib/customerAttention';
import { deriveJourney, type CustomerJourney } from '../lib/customerJourney';

/** Bounded far beyond any single advisor's book (.claude/rules/query-compliance.md). */
const QUEUE_LIMIT = 5000;

/** The columns the queue math consumes — never `select('*')` on a whole-book read. */
const CUSTOMER_COLUMNS =
  'id, name, email, phone, date_of_birth, occupation, annual_income, next_review_date, risk_profile, created_date, created_at';

/** One customer as every Overview surface consumes them. */
export interface QueueCustomer {
  id: string;
  name: string;
  riskProfile: string | null;
  addedDate: string | null;
  lastContactDate: string | null;
  email: string | null;
  phone: string | null;
  journey: CustomerJourney;
  attention: CustomerAttention;
  /** Human-readable "why is this here" line for the queue row. */
  reasonText: string;
}

export interface CustomerQueue {
  /** Gone quiet — no contact logged for QUIET_DAYS or more. Longest wait first. */
  quiet: QueueCustomer[];
  /** Chain incomplete (and not already surfaced as quiet). Oldest first. */
  unfinished: QueueCustomer[];
  /** Reviews landing inside REVIEW_WINDOW_DAYS (and not surfaced above). Soonest first. */
  reviewsDue: QueueCustomer[];
  /** Every customer needing something — the greeting's "N are waiting on you". */
  totalWaiting: number;
  /** Non-deleted customers visible to the viewer. */
  totalCustomers: number;
  /** Customers added in the current Singapore calendar month. */
  addedThisMonth: number;
}

/**
 * Fetch and assemble the Overview queue. Sections are mutually exclusive —
 * `deriveAttention` picks one headline reason per customer — so the four
 * figures across the top never double-count a single person.
 */
export async function getCustomerQueue(): Promise<CustomerQueue> {
  const [customersResult, interactionsResult, resultsResult] = await Promise.all([
    supabase
      .from('clients')
      .select(CUSTOMER_COLUMNS)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(QUEUE_LIMIT),
    supabase
      .from('interactions')
      .select('client_id, date')
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(QUEUE_LIMIT),
    supabase
      .from('results')
      .select('client_id')
      .not('client_id', 'is', null)
      .limit(QUEUE_LIMIT),
  ]);
  if (customersResult.error) throw customersResult.error;
  if (interactionsResult.error) throw interactionsResult.error;
  if (resultsResult.error) throw resultsResult.error;

  // Interactions arrive newest-first, so the FIRST hit per customer is the
  // latest contact — no per-row date comparison needed.
  const lastContact = new Map<string, string>();
  for (const row of interactionsResult.data ?? []) {
    if (row.client_id && !lastContact.has(row.client_id)) {
      lastContact.set(row.client_id, row.date);
    }
  }

  const profiled = new Set(
    (resultsResult.data ?? []).map((row) => row.client_id).filter((id): id is string => Boolean(id)),
  );

  const refDate = getCurrentSingaporeTime();
  // Singapore calendar month, not UTC — west of SGT the two disagree for the
  // first eight hours of every month and the figure would silently reset late.
  const monthPrefix = getLocalDateString(refDate).slice(0, 7);

  const quiet: QueueCustomer[] = [];
  const unfinished: QueueCustomer[] = [];
  const reviewsDue: QueueCustomer[] = [];
  let addedThisMonth = 0;

  for (const row of customersResult.data ?? []) {
    const journey = deriveJourney({
      hasProfile: profiled.has(row.id),
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      occupation: row.occupation,
      annualIncome: row.annual_income,
      nextReviewDate: row.next_review_date,
    });

    const addedDate = row.created_date ?? row.created_at;
    const attention = deriveAttention(
      {
        lastContactDate: lastContact.get(row.id) ?? null,
        addedDate,
        nextReviewDate: row.next_review_date,
        journey,
      },
      refDate,
    );

    if (addedDate && getLocalDateString(addedDate).startsWith(monthPrefix)) addedThisMonth += 1;

    const customer: QueueCustomer = {
      id: row.id,
      name: row.name,
      riskProfile: row.risk_profile,
      addedDate,
      lastContactDate: lastContact.get(row.id) ?? null,
      email: row.email,
      phone: row.phone,
      journey,
      attention,
      reasonText: describeAttention(attention, journey),
    };

    if (attention.reason === 'quiet') quiet.push(customer);
    else if (attention.reason === 'unfinished') unfinished.push(customer);
    else if (attention.reason === 'review-due') reviewsDue.push(customer);
  }

  quiet.sort((a, b) => (b.attention.quietDays ?? 0) - (a.attention.quietDays ?? 0));
  unfinished.sort((a, b) => (b.attention.quietDays ?? 0) - (a.attention.quietDays ?? 0));
  reviewsDue.sort(
    (a, b) => (a.attention.reviewInDays ?? 0) - (b.attention.reviewInDays ?? 0),
  );

  return {
    quiet,
    unfinished,
    reviewsDue,
    totalWaiting: quiet.length + unfinished.length + reviewsDue.length,
    totalCustomers: customersResult.data?.length ?? 0,
    addedThisMonth,
  };
}
