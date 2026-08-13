/**
 * profilerEntry — the ONE place the CRM builds a link into the Prospect
 * Profiler for a customer it already has on file.
 *
 * The contract has two halves and both matter:
 *   ?prospect=<name>     so the advisor never retypes who they came to profile
 *   ?customerId=<uuid>   so the saved result carries `results.client_id`
 *
 * The id is the load-bearing one. "Profiled" is decided by `client_id` alone
 * (`customerQueueService` → `deriveJourney({ hasProfile })`) and never by a
 * name match, so a name-only entry produced a real profile that left the
 * customer sitting in Unfinished work reading "Never profiled" permanently.
 * Two call sites drifting apart is exactly how that half-link shipped, so
 * both the queue row and the customer-detail launcher come through here.
 *
 * Generic entries (the Overview launcher band, the add-customer modal) stay
 * BARE on purpose — there is no customer yet to link to.
 */

export const PROFILER_PATH = '/profiler';

/** The customer fields the profiler entry link needs. */
export interface ProfilerEntryCustomer {
  id: string;
  name: string;
}

/** `/profiler?prospect=…&customerId=…` for a customer already on file. */
export function profilerHrefFor({ id, name }: ProfilerEntryCustomer): string {
  const params = new URLSearchParams({ prospect: name, customerId: id });
  return `${PROFILER_PATH}?${params.toString()}`;
}
