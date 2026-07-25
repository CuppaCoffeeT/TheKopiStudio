/**
 * Report section [10] — policy portfolio grouped by type (legacy
 * ClientReportModal.jsx:76-80,439-480, git c09c549).
 *
 * Insertion-order grouping on the raw type string (legacy `policyTypes`
 * object), one table per group with the policy count in the heading. ALWAYS
 * renders — an empty book shows the legacy "No policies on record." line.
 * Coverage cells parseInt-truncate via toFloat (legacy `parseInt(v || 0)`),
 * the premium cell prints the RAW form string "$<premium>/<frequency>" with
 * no coercion, exactly like legacy. Print-first light-locked per the
 * report-print.css contract.
 */

import { toFloat } from '../../lib/finance';
import type { CrmPolicy } from '../../types';

/** Legacy `parseInt(v || 0).toLocaleString()` cells — truncate, never round. */
const moneyTrunc = (value: string): string => `$${Math.trunc(toFloat(value)).toLocaleString()}`;

export function ReportPolicyPortfolio({ policies }: { policies: CrmPolicy[] }) {
  // ClientReportModal.jsx:76-80 — first-seen insertion order per type.
  const groups = new Map<string, CrmPolicy[]>();
  for (const policy of policies) {
    const group = groups.get(policy.type);
    if (group) group.push(policy);
    else groups.set(policy.type, [policy]);
  }

  return (
    <section className="report-section" data-testid="report-policy-portfolio">
      <h2>Policy portfolio</h2>
      {groups.size === 0 ? (
        <p className="text-[12px] text-[color:var(--fg-dim)]">No policies on record.</p>
      ) : (
        [...groups.entries()].map(([type, group]) => (
          <div key={type} className="mb-4" data-testid={`report-portfolio-group-${type}`}>
            <h3>
              {type} ({group.length})
            </h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Provider</th>
                  <th scope="col">Policy #</th>
                  <th scope="col">Death benefit</th>
                  <th scope="col">CI coverage</th>
                  <th scope="col">Premium</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {group.map((policy) => (
                  <tr key={policy.id} data-testid={`report-portfolio-row-${policy.id}`}>
                    <td>{policy.provider}</td>
                    <td>{policy.policyNumber}</td>
                    <td>{moneyTrunc(policy.coverageAmount)}</td>
                    <td>{moneyTrunc(policy.criticalIllnessCoverage)}</td>
                    <td>
                      ${policy.premium}/{policy.frequency}
                    </td>
                    <td>{policy.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </section>
  );
}
