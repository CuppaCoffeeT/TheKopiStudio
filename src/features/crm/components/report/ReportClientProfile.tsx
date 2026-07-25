/**
 * Report section [3] — client profile facts (legacy ClientReportModal.jsx:
 * 145-181). Age / years-to-retirement / income arrive pre-computed from lib
 * via the page (ageFromDOB · heroTotals · summariseClient); missing DOB
 * renders 'Not specified' per legacy (the age math already defaulted to 40
 * inside lib). Notes block renders only when notes exist (legacy condition).
 * Print-first light-locked per report-print.css.
 */

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
        <h3>{client.name}</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <Fact label="Email" value={client.email} />
          <Fact label="Phone" value={client.phone} />
          <Fact label="Date of birth" value={client.dateOfBirth || 'Not specified'} />
          <Fact label="Current age" value={String(currentAge)} />
          <Fact label="Occupation" value={client.occupation} />
          <Fact label="Annual income" value={`$${income.toLocaleString()}`} />
          <Fact label="Risk profile" value={client.riskProfile} />
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
