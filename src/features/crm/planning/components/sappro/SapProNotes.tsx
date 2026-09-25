/**
 * "Scheme notes" — the sheet's second tab, copy verbatim: the tiers, what
 * counts, removal, clawback on leaving early, and how the calculator works.
 */

import type { ReactNode } from 'react';
import { ToolPanel } from '@/components/primitives/tools';

const H3 = 'm-0 mb-2 mt-6 text-[15px] font-semibold text-foreground';
const P = 'm-0 text-[14px] leading-[1.6] text-[color:var(--fg-dim)]';
const UL = 'm-0 my-1.5 list-disc space-y-1.5 pl-5 text-[14px] leading-[1.6] text-[color:var(--fg-dim)]';
const CELL = 'border-b border-border px-2 py-[7px] text-left align-top';

function NotesTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mt-2.5 overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[480px] border-collapse text-[13px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className={`${CELL} bg-secondary font-semibold text-[color:var(--fg-dim)]`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={head[i]} className={`${CELL} text-foreground`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Heading = ({ children }: { children: ReactNode }) => <h3 className={H3}>{children}</h3>;

export function SapProNotes() {
  return (
    <ToolPanel label="How the income support scheme works" className="max-w-[760px]" testId="sap-pro-notes">
      <p className={P}>
        The scheme pays a monthly allowance on top of your commission while you build your practice. How much you
        receive each month depends on how much first-year commission (EFYC) you produce that month.
      </p>

      <Heading>The tiers</Heading>
      <NotesTable
        head={['Tier', 'Paid for', 'Minimum to receive anything', 'Target for full payout']}
        rows={[
          ['$1,000 (Apprentice)', 'Months 1–12', '$200 EFYC', '$1,000 EFYC'],
          ['$5,000', 'Months 1–24', '$500 (months 1–3), $1,250 after', '$6,250 EFYC'],
          ['$8,000', 'Months 1–24', '$500 (months 1–3), $1,250 after', '$10,000 EFYC'],
          ['$10,000', 'Months 1–24', '$500 (months 1–3), $1,250 after', '$12,500 EFYC'],
        ]}
      />
      <p className={`${P} mt-2.5`}>
        Between the minimum and the target, the payout is pro-rated. For example, on the $5,000 tier, $3,000 of EFYC
        in a month pays $3,000 ÷ $6,250 × $5,000 = $2,400. The $8,000 and $10,000 tiers have a minimum previous salary
        requirement.
      </p>

      <Heading>What counts</Heading>
      <ul className={UL}>
        <li>Cases on your own life do not count. Cases for your family do.</li>
        <li>No 25% monthly bonus (BDB) on commission from your first 12 months while on the scheme.</li>
        <li>You must keep at least 85% of your policies in force (conservation / persistency).</li>
        <li>
          An annual catch-up at months 12 and 24 may add payouts for production above target. It depends on each case,
          so this calculator leaves it out.
        </li>
      </ul>

      <Heading>When the company can remove you from the scheme</Heading>
      <p className={P}>The company can remove you and claw back payouts if you:</p>
      <ul className={UL}>
        <li>have no activity ($0 EFYC) for 3 months in a row,</li>
        <li>attend less than 80% of the MoRE programme ($5k, $8k and $10k tiers),</li>
        <li>produce less than $15,000 EFYC in a year ($5k, $8k and $10k tiers), or</li>
        <li>leave before completing 3 years ($5k, $8k and $10k tiers).</li>
      </ul>

      <Heading>If you leave early</Heading>
      <p className={P}>You pay back a share of the income support you received:</p>
      <NotesTable
        head={['Leaving during', '$1,000 tier', '$5k / $8k / $10k tiers']}
        rows={[
          ['Months 1–12', '100%', '100%'],
          ['Months 13–24', 'Not applicable', '100%'],
          ['Months 25–36', 'Not applicable', '50%'],
        ]}
      />

      <Heading>How this calculator works</Heading>
      <ul className={UL}>
        <li>Base commission is treated as your EFYC for the scheme calculation.</li>
        <li>
          Monthly bonus (BDB) is 25% of base commission. If you are on the income support scheme, there is no monthly
          bonus on commission from your first 12 months. It starts from month 13.
        </li>
        <li>Quarterly bonus is the chosen rate on 3 months of base commission, paid at the end of each quarter.</li>
        <li>Both bonuses are on commission only, never on income support.</li>
        <li>Year 3 shows income with no income support.</li>
        <li>Renewal commissions, the annual catch-up and other incentives are not included.</li>
      </ul>

      <div className="mt-4 rounded-r-lg border-l-[3px] border-l-[color:var(--brand-terracotta)] bg-popover px-4 py-3 text-[13.5px] leading-[1.6] text-foreground">
        This is an illustration to help you plan, not a promise of income. Actual earnings depend on your own
        production, the scheme terms in force when you join, and company approval.
      </div>
    </ToolPanel>
  );
}
