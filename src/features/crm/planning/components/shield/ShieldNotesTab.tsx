/**
 * Notes tab — sources, premium basis and caveats. Read before putting any of
 * the comparison in front of a client.
 */

import type { ReactNode } from 'react';
import { ShieldFlag, ShieldHeading } from './ShieldAtoms';

function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 mt-2 max-w-[68ch] text-[13px] leading-[1.6] text-[color:var(--fg-dim)]">{children}</p>;
}

export function ShieldNotesTab() {
  return (
    <div>
      <ShieldFlag>
        <b>This is not advice.</b> It does not replace a fact find, a needs analysis or your own
        suitability assessment. Comparative material naming two insurers usually needs compliance sign-off
        before a client sees it.
      </ShieldFlag>

      <ShieldHeading>Sources</ShieldHeading>
      <Note>
        Singlife Shield policy booklet H54.01 (1 Apr 2026). Singlife Health Plus Private and Public policy
        contract H58.01 (1 Apr 2026). Singlife Shield and Health Plus premium rates effective 1 Apr 2026.
        Enhanced IncomeShield policy conditions LHO/202604 and schedule of benefits. Optima Care Rider
        conditions LHO/202604. Income standard premium tables and Optima Care rider rates effective 1 Apr
        2026. Singlife Cancer Cover Plus II product summary, Apr 2026. MOH Cancer Drug List, 1 Sep 2026.
      </Note>

      <ShieldHeading>Premium basis</ShieldHeading>
      <Note>
        Standard premiums for a standard life — Singapore Citizen or PR, no pre-existing conditions, no
        loading. Inclusive of 9% GST. No No Claims Discount is applied on the Income side, as no NCD
        schedule appears in the Income documents held.
      </Note>

      <ShieldHeading>What this leaves out</ShieldHeading>
      <Note>
        Public tiers — Singlife Plan 2 and 3, Income Advantage, Basic and Enhanced C — are not here.
        Underwriting outcomes are not modelled. Bill amounts in the claim scenarios are illustrative; use
        the client’s actual hospital quote.
      </Note>

      <ShieldHeading>Still unconfirmed</ShieldHeading>
      <Note>
        Where Cancer Cover Plus II sits in the claim order. Neither contract states it outright. Confirm
        with Singlife before quoting any figure that involves the top-up.
      </Note>

      <ShieldHeading>Two things worth knowing</ShieldHeading>
      <Note>
        Singlife’s five-year moratorium underwriting is closed to new business and applies only to legacy
        policyholders. Both insurers now require full medical declaration.
      </Note>
      <Note>
        Singlife’s free child cover to age 20 is the Plan 2 <b>Public</b> rider. It is worth nothing when
        you are placing a child on Plan 1 Private.
      </Note>

      <p className="m-0 mt-10 border-t border-border pt-4 text-[12.5px] text-muted-foreground">
        Built from policy contracts, not brochures. Every figure recomputed and checked against source.
        Internal use.
      </p>
    </div>
  );
}
