/**
 * Report section [7] — investment-linked policy analysis (legacy
 * ClientReportModal.jsx:349-421). Rendered by the page ONLY when at least one
 * policy isInvestmentLinked (legacy condition). The age-55/65 value cards
 * appear per policy only when that illustrated value is > 0 (lib toFloat
 * coercion, legacy `parseFloat(v || 0)`). Cell display mirrors the legacy
 * coercions — parseInt cells truncate, the premium cell is
 * parseFloat(...).toLocaleString(), formatting only, no math — with one
 * deliberate defensive divergence: falsy values fall back to '0' so cells
 * render $0 where legacy printed $NaN.
 */

import { toFloat } from '../../lib/finance';
import type { CrmPolicy } from '../../types';

const intMoney = (value: string): string => `$${parseInt(value || '0', 10).toLocaleString()}`;

function ValueCard({ label, value, testId }: { label: string; value: number; testId: string }) {
  return (
    <div className="rounded-md bg-white p-2" data-testid={testId}>
      <div className="text-[11px] text-[color:var(--fg-dim)]">{label}</div>
      {/* Kopi sage #4A6A4E — 6.06:1 on the white value card. */}
      <div className="text-[20px] font-medium" style={{ color: '#4a6a4e' }}>
        ${Math.round(value).toLocaleString()}
      </div>
    </div>
  );
}

export function ReportIlpAnalysis({ policies }: { policies: CrmPolicy[] }) {
  return (
    <section className="report-section" data-testid="report-ilp-analysis">
      <h2>Investment-linked policy analysis</h2>
      {policies.map((policy) => {
        const age55 = toFloat(policy.illustratedValueAge55);
        const age65 = toFloat(policy.illustratedValueAge65);
        return (
          <div
            key={policy.id}
            className="report-callout report-callout--success"
            data-testid={`report-ilp-card-${policy.id}`}
          >
            <h3>
              {policy.type} — {policy.provider}
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
              <div>
                <div>
                  <strong>Policy number:</strong> {policy.policyNumber}
                </div>
                <div>
                  <strong>Current account value:</strong> {intMoney(policy.currentAccountValue)}
                </div>
                <div>
                  <strong>Annual premium:</strong> ${toFloat(policy.premium).toLocaleString()}
                </div>
                <div>
                  <strong>Allocation:</strong> {policy.investmentAllocation || 'Not specified'}
                </div>
              </div>
              <div>
                <div>
                  <strong>Death benefit:</strong> {intMoney(policy.coverageAmount)}
                </div>
                <div>
                  <strong>CI coverage:</strong> {intMoney(policy.criticalIllnessCoverage)}
                </div>
                <div>
                  <strong>Early CI:</strong> {intMoney(policy.earlyCriticalIllnessCoverage)}
                </div>
              </div>
            </div>
            {(age55 > 0 || age65 > 0) && (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[color:var(--border-soft)] pt-3 sm:grid-cols-2">
                {age55 > 0 && (
                  <ValueCard
                    label="Pre-retirement (age 55)"
                    value={age55}
                    testId={`report-ilp-value-55-${policy.id}`}
                  />
                )}
                {age65 > 0 && (
                  <ValueCard
                    label="Retirement (age 65)"
                    value={age65}
                    testId={`report-ilp-value-65-${policy.id}`}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
