/**
 * Report section — "What you can access today" (v42, 2026-09-25): what the
 * policies would actually pay if surrendered now, against the value built up.
 *
 * Self-guarding: renders only when a policy carries a surrender value (the
 * reference's `policiesWithSurrenderValue.length > 0`). ALL figures from
 * lib/protectionStructure `liquidity`; formatting only here.
 */

import { liquidity } from '../../lib/protectionStructure';
import type { CrmPolicy } from '../../types';

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;

export function ReportLiquidity({ policies }: { policies: CrmPolicy[] }) {
  const { total, lines } = liquidity(policies);
  if (lines.length === 0) return null;

  return (
    <section className="report-section" data-testid="report-liquidity">
      <h2>What you can access today</h2>
      <p className="text-[12px] text-[color:var(--fg-dim)]">
        If you needed cash at short notice, this is what your policies would actually pay out if
        surrendered now.
      </p>

      <div className="report-callout report-callout--success flex items-center justify-between gap-3">
        <span className="text-[13px]">Total available if surrendered today</span>
        <strong className="text-[22px]" data-testid="report-liquidity-total">
          {money(total)}
        </strong>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th scope="col">Policy</th>
            <th scope="col" className="num">Value built up</th>
            <th scope="col" className="num">If cashed out today</th>
            <th scope="col" className="num">Difference</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ policy, built, surrender, difference }) => (
            <tr key={policy.id} data-testid={`report-liquidity-row-${policy.id}`}>
              <td>
                {policy.type}
                <span className="block text-[10px] text-[color:var(--fg-dim)]">
                  {policy.provider}
                </span>
              </td>
              <td className="num">{built > 0 ? money(built) : '—'}</td>
              <td className="num">
                <strong>{money(surrender)}</strong>
              </td>
              {/* #8F3D1F — the report's negative accent (decisions.md 2026-07-27). */}
              <td className="num" style={built > 0 && difference > 0 ? { color: '#8F3D1F' } : undefined}>
                {built > 0 ? (difference > 0 ? `-${money(difference)}` : '$0') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="report-callout">
        <p className="m-0 text-[12px] leading-[1.6]">
          <strong>Why the cash-out figure is lower:</strong> policy charges are heaviest in the early
          years, so surrendering now returns less than the value built up. The gap narrows over time
          and usually closes as the policy matures. Surrendering also ends the protection the policy
          provides — treat it as an emergency option rather than a plan.
        </p>
      </div>
    </section>
  );
}
