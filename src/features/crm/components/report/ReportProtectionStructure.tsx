/**
 * Report section [4] tail (v42, 2026-09-25) — how the covers above actually
 * behave: Personal Accident shown on its own, the accelerated-CI "one pot"
 * explanation with the true maximum claimable, and the policies behind the
 * protection figures. Rendered inside `ReportCoverageAnalysis`.
 *
 * ALL figures from lib/protectionStructure; formatting only here. Each block
 * self-guards exactly like the reference (PA > 0 · ≥1 accelerated CI policy ·
 * ≥1 policy with death or CI cover).
 */

import {
  ciStructure,
  personalAccidentCover,
  protectionContributors,
} from '../../lib/protectionStructure';
import { toFloat } from '../../lib/finance';
import type { CrmPolicy } from '../../types';

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;
const cell = (value: string): string => (toFloat(value) > 0 ? money(toFloat(value)) : '—');

export function ReportProtectionStructure({ policies }: { policies: CrmPolicy[] }) {
  const pa = personalAccidentCover(policies);
  const ci = ciStructure(policies);
  const contributors = protectionContributors(policies);

  return (
    <>
      {pa > 0 && (
        <div className="report-callout" data-testid="report-pa-cover">
          <strong>Personal Accident cover: {money(pa)}</strong>
          <p className="m-0 mt-1 text-[12px] leading-[1.6]">
            Shown on its own rather than added to the death cover above: it only pays for death or
            injury caused by an accident, not for death from illness — the more likely event for
            most people. Useful to have, but an addition to life insurance, not a replacement.
          </p>
        </div>
      )}

      {ci.acceleratedCICount > 0 && (
        <div className="report-callout report-callout--warning" data-testid="report-ci-accelerated">
          <strong>How your death and critical illness cover work together</strong>
          <p className="m-0 mt-1 text-[12px] leading-[1.6]">
            {ci.acceleratedCICount === ci.ciPoliciesCount
              ? 'Your critical illness cover is accelerated: a CI claim is paid out of the death benefit, not on top of it, so the two amounts share one pot rather than adding up.'
              : `${ci.acceleratedCICount} of your ${ci.ciPoliciesCount} policies with critical illness cover are accelerated (the CI claim comes out of the death benefit).${
                  ci.standaloneCICount > 0
                    ? ` The other ${ci.standaloneCICount === 1 ? 'one pays' : `${ci.standaloneCICount} pay`} on top of the death benefit.`
                    : ''
                }`}
          </p>
          <p className="m-0 mt-2 text-[12px]">
            Most you could ever claim across all policies:{' '}
            <strong data-testid="report-ci-max-claimable">{money(ci.maxClaimableTotal)}</strong>
          </p>
          {ci.acceleratedOverlap > 0 && (
            <p className="m-0 mt-1 text-[11px] italic">
              Adding every figure together would suggest {money(ci.naiveTotal)} — that overstates by{' '}
              {money(ci.acceleratedOverlap)}, because accelerated cover shares one pot.
            </p>
          )}
        </div>
      )}

      {contributors.length > 0 && (
        <div className="mt-4" data-testid="report-protection-policies">
          <h3>Policies providing this protection</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th scope="col">Policy</th>
                <th scope="col">Insurer</th>
                <th scope="col" className="num">Death / TPD</th>
                <th scope="col" className="num">Critical illness</th>
                <th scope="col" className="num">Early CI</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.type}
                    {toFloat(p.criticalIllnessCoverage) > 0 && p.ciAccelerated !== false && (
                      <span className="block text-[10px] text-[color:var(--fg-dim)]">
                        CI accelerated — shares the death benefit
                      </span>
                    )}
                  </td>
                  <td>{p.provider}</td>
                  <td className="num">{cell(p.coverageAmount)}</td>
                  <td className="num">{cell(p.criticalIllnessCoverage)}</td>
                  <td className="num">{cell(p.earlyCriticalIllnessCoverage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
