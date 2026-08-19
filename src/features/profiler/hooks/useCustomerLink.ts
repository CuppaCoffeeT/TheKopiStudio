/**
 * useCustomerLink — the CRM ENTRY CONTRACT, read and written in one place.
 *
 * Two query params, and they must never drift apart:
 *   ?prospect=<name>       seeds the intake name (a draft or typed name wins)
 *   ?customerId=<uuid>     links the saved result to that customer record
 *
 * The id is the load-bearing half: the Overview queue decides "profiled" from
 * `results.client_id` alone, so a name-only entry produced a real profile that
 * left the customer reading "Never profiled" for good (lib/decisions.md
 * 2026-08-13).
 *
 * Split out of `useWizardController` (2026-08-19) when that file crossed the
 * 200-LOC ceiling — and the seam holds the contract together rather than
 * scattering it: the READ (arriving from the CRM) and the WRITE (picking in the
 * intake screen's `ToolCustomerBar`) now sit in one file, so the two doorways
 * cannot spell the same thing differently. `chooseCustomer` deliberately writes
 * `?customerId=`, NOT the `?customer=` that tools 04–06 use — see decisions.md.
 */

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { IntakeInfo } from './useWizardState';

interface UseCustomerLinkArgs {
  intake: IntakeInfo;
  setIntake: (next: IntakeInfo) => void;
}

export function useCustomerLink({ intake, setIntake }: UseCustomerLinkArgs) {
  const [searchParams, setSearchParams] = useSearchParams();

  // The wizard never navigates, so the params survive a mid-flow refresh
  // alongside the sessionStorage draft — no need to mirror them into state.
  const customerId = searchParams.get('customerId');

  // Seed the prospect name once on arrival; a draft-restored or hand-typed
  // name always wins, so the seed only ever fills an empty field.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const prospect = searchParams.get('prospect');
    if (prospect && !intake.name.trim()) setIntake({ ...intake, name: prospect });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The intake screen's customer picker. Writes the SAME pair the CRM entry
   * link writes (`crm/lib/profilerEntry.profilerHrefFor`).
   *
   * Picking OVERWRITES a typed name — you chose a record, so the record wins.
   * Clearing does not: it drops the link and leaves the text alone, because
   * "not linked to a record" and "erase what I typed" are different intents,
   * and only one of them is what the Clear button offers.
   */
  const chooseCustomer = (next: { id: string; name: string } | null) => {
    const updated = new URLSearchParams(searchParams);
    if (next) {
      updated.set('customerId', next.id);
      updated.set('prospect', next.name);
      setIntake({ ...intake, name: next.name });
    } else {
      updated.delete('customerId');
      updated.delete('prospect');
    }
    // `replace: true` — picking a customer is not a place you navigate back to,
    // and the wizard's Back button already means "previous step".
    setSearchParams(updated, { replace: true });
  };

  return { customerId, chooseCustomer };
}
