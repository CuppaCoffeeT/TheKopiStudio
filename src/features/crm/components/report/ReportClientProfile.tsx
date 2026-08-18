/**
 * Report section [3] — client profile facts (legacy ClientReportModal.jsx:
 * 145-181). Age / years-to-retirement / income arrive pre-computed from lib
 * via the page (ageFromDOB · heroTotals · summariseClient).
 *
 * EMPTY FIELDS PRINT `NIL` (2026-08-18), not a silent blank and not a derived
 * zero. The report is now generated for records at any stage of completeness,
 * so "we have not asked yet" has to be visibly different from "the answer is
 * nothing" — `$0 annual income` and `income unknown` are opposite facts to an
 * advisor reading the page back to a customer. Age and years-to-retirement are
 * the exception: they stay numeric because lib defaults an unknown DOB to 40
 * and every downstream figure is already computed off that default, so printing
 * NIL here would contradict the projections below. The DOB row above them says
 * NIL, which is where the honesty belongs.
 *
 * Notes block renders only when notes exist (legacy condition).
 * Print-first light-locked per report-print.css.
 */

import { nilMoney, nilOr } from '../../lib/reportCompleteness';
import type { CrmClient } from '../../types';

interface ReportClientProfileProps {
  client: CrmClient;
  currentAge: number;
  yearsToRetirement: number;
  /** summariseClient(...).income — already `toFloat`-coerced by lib. */
  income: number;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[13px]">
      <strong>{label}:</strong> {value}
    </div>
  );
}

export function ReportClientProfile({
  client,
  currentAge,
  yearsToRetirement,
  income,
}: ReportClientProfileProps) {
  return (
    <section className="report-section" data-testid="report-client-profile">
      <h2>Client profile</h2>
      <div className="rounded-lg bg-card p-4">
        <h3>{nilOr(client.name)}</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <Fact label="Email" value={nilOr(client.email)} />
          <Fact label="Phone" value={nilOr(client.phone)} />
          <Fact label="Date of birth" value={nilOr(client.dateOfBirth)} />
          <Fact label="Current age" value={String(currentAge)} />
          <Fact label="Occupation" value={nilOr(client.occupation)} />
          <Fact
            label="Annual income"
            value={client.annualIncome.trim() ? `$${income.toLocaleString()}` : nilMoney(null)}
          />
          <Fact label="Risk profile" value={nilOr(client.riskProfile)} />
          <Fact label="Years to retirement" value={String(yearsToRetirement)} />
        </div>
        {client.notes && (
          <div className="mt-3 border-t border-[color:var(--border-soft)] pt-3 text-[13px]">
            <strong>Notes:</strong> {client.notes}
          </div>
        )}
      </div>
    </section>
  );
}
