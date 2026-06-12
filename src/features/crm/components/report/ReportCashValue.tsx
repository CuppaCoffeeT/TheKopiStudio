/**
 * Report section [5] — cash value accumulation (legacy ClientReportModal.jsx:
 * 261-295). Rendered by the page ONLY when at least one policy hasCashValue
 * (legacy condition). One row per cash-value policy with its projection list
 * ('No projections' fallback). Display mirrors the legacy `parseInt(v)` cell
 * coercion — truncation is the legacy display semantic, no math — with one
 * deliberate defensive divergence: falsy values fall back to '0' so cells
 * render $0 where legacy printed $NaN.
 */

import type { CrmPolicy } from '../../types';

const intMoney = (value: string): string => `$${parseInt(value || '0', 10).toLocaleString()}`;

export function ReportCashValue({ policies }: { policies: CrmPolicy[] }) {
  return (
    <section className="report-section" data-testid="report-cash-value">
      <h2>Cash value accumulation</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th scope="col">Policy</th>
            <th scope="col">Provider</th>
            <th scope="col" className="num">Current cash value</th>
            <th scope="col">Future projections</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id} data-testid={`report-cash-value-row-${policy.id}`}>
              <td>{policy.type}</td>
              <td>{policy.provider}</td>
              <td className="num">{intMoney(policy.currentCashValue)}</td>
              <td>
                {policy.projectedCashValue.length > 0
                  ? policy.projectedCashValue.map((projection) => (
                      <div key={projection.age}>
                        Age {projection.age}: <strong>{intMoney(projection.value)}</strong>
                      </div>
                    ))
                  : 'No projections'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
