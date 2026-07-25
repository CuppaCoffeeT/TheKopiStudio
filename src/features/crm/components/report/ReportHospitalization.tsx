/**
 * Report section [6] — hospitalization coverage cards (legacy
 * ClientReportModal.jsx:297-347). Rendered by the page ONLY when at least one
 * policy isHospitalization (legacy condition). ALL sums (IS = CPF + cash,
 * Total = IS + rider) come from lib hospitalShieldPremiums — only
 * toLocaleString formatting happens here. The bold Total row keeps the legacy
 * in-progress-tint highlight via .report-row-total (print-color locked in CSS).
 */

import { hospitalShieldPremiums } from '../../lib/financeReport';
import type { CrmPolicy } from '../../types';

const money = (value: number): string => `$${value.toLocaleString()}`;

export function ReportHospitalization({ policies }: { policies: CrmPolicy[] }) {
  return (
    <section className="report-section" data-testid="report-hospitalization">
      <h2>Hospitalization coverage</h2>
      {policies.map((policy) => {
        const premiums = hospitalShieldPremiums(policy);
        return (
          <div
            key={policy.id}
            className="report-callout report-callout--warning"
            data-testid={`report-hospitalization-card-${policy.id}`}
          >
            <h3>
              {policy.provider} — {policy.hospitalType} Hospital Plan
            </h3>
            <div className="mb-2 text-[12px]">
              <strong>Policy number:</strong> {policy.policyNumber}
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Component</th>
                  <th scope="col" className="num">Annual premium</th>
                  <th scope="col">Payment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Integrated Shield Plan</td>
                  <td className="num">
                    {money(premiums.cpf)} CPF + {money(premiums.cash)} cash ={' '}
                    {money(premiums.shieldTotal)}
                  </td>
                  <td>CPF Medisave + cash</td>
                </tr>
                <tr>
                  <td>Rider</td>
                  <td className="num">{money(premiums.rider)}</td>
                  <td>Full cash</td>
                </tr>
                <tr className="report-row-total">
                  <td>Total</td>
                  <td className="num">{money(premiums.totalAnnual)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}
