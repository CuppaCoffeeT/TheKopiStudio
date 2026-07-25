/**
 * Report section [9] economic block — opportunity cost, inflation impact and
 * recommendations (legacy report/RetirementProjection.jsx:131-216, git
 * c09c549; rendered inside ReportRetirementProjection only).
 *
 * EVERY number comes from lib/financeReportEconomics(+Sections): investedAt6,
 * opportunityCost, totalRetirementIfInvested, retirementSumOpportunityCost,
 * purchasingPowerLoss2_5, emergencyFundTarget and
 * excessInvestableRecommendation (which owns the strict `>` guard AND the
 * riskProfile lowercasing) — only Math.round / toFixed / locale formatting
 * happens here. The opportunity-cost table renders only when a bank balance
 * exists (legacy line 131); the inflation + recommendations alerts always do.
 */

import {
  GENERAL_INFLATION_RATE,
  emergencyFundTarget,
  excessInvestableRecommendation,
  investedAt6,
  opportunityCost,
  purchasingPowerLoss2_5,
  retirementSumOpportunityCost,
  totalRetirementIfInvested,
} from '../../lib/financeReport';

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;

interface ReportRetirementEconomicsProps {
  balance: number;
  income: number;
  yearsTo65: number;
  ilpValueAt65: number;
  bankAt65: number;
  totalRetirementSum: number;
  riskProfile: string;
}

export function ReportRetirementEconomics({
  balance,
  income,
  yearsTo65,
  ilpValueAt65,
  bankAt65,
  totalRetirementSum,
  riskProfile,
}: ReportRetirementEconomicsProps) {
  const investedBankAt65 = investedAt6(balance, yearsTo65);
  const bankOpportunityCost = opportunityCost(balance, yearsTo65);
  const totalIfInvested = totalRetirementIfInvested(ilpValueAt65, balance, yearsTo65);
  const totalOpportunityCost = retirementSumOpportunityCost(ilpValueAt65, balance, yearsTo65);
  const purchasingPower = purchasingPowerLoss2_5(totalRetirementSum, yearsTo65);
  const recommendation = excessInvestableRecommendation(balance, income, riskProfile);

  return (
    <>
      {balance > 0 && (
        <div
          className="report-callout report-callout--warning"
          data-testid="report-retirement-opportunity"
        >
          <h3>Bank balance opportunity cost</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col" className="num">Bank at 65</th>
                <th scope="col" className="num">Total retirement sum</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Current plan (keep in bank)</td>
                <td className="num">{money(bankAt65)}</td>
                <td className="num">{money(totalRetirementSum)}</td>
              </tr>
              {/* Kopi sage #4A6A4E / terracotta #AB4925 — 13px cells need
                  4.5:1 on the in-progress warning-callout (#F0E2CF, 4.76) and
                  the error loss-row (#FAE0D6, 4.50). The raw brand sage and
                  terracotta both miss AA at this size. */}
              <tr>
                <td>If invested (6% returns)</td>
                <td className="num" style={{ color: '#4a6a4e', fontWeight: 500 }}>
                  {money(investedBankAt65)}
                </td>
                <td className="num" style={{ color: '#4a6a4e', fontWeight: 500 }}>
                  {money(totalIfInvested)}
                </td>
              </tr>
              <tr className="report-row-loss" data-testid="report-retirement-opportunity-cost">
                <td>Opportunity cost</td>
                <td className="num" style={{ color: '#ab4925', fontWeight: 500 }}>
                  {money(bankOpportunityCost)}
                </td>
                <td className="num" style={{ color: '#ab4925', fontWeight: 500 }}>
                  {money(totalOpportunityCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div
        className="report-callout report-callout--danger"
        data-testid="report-retirement-inflation"
      >
        <h3>Inflation impact</h3>
        <p className="m-0 mb-2 text-[13px]">
          With {(GENERAL_INFLATION_RATE * 100).toFixed(1)}% annual inflation over {yearsTo65}{' '}
          years, your retirement sum of {money(totalRetirementSum)} will have the purchasing power
          of only {money(purchasingPower.purchasingPowerToday)} in today&apos;s dollars.
        </p>
        <div className="font-semibold" data-testid="report-retirement-ppl">
          Purchasing power loss: {money(purchasingPower.loss)} (
          {purchasingPower.lossPct.toFixed(1)}%)
        </div>
      </div>

      <div
        className="report-callout report-callout--primary"
        data-testid="report-retirement-recommendations"
      >
        <h3>Recommendations</h3>
        <ol className="m-0 list-decimal pl-5 text-[13px]">
          <li>
            ILP policies projected to grow to {money(ilpValueAt65)} by age 65 based on benefit
            illustrations.
          </li>
          <li>
            Keep 6–12 months of expenses as emergency fund in bank (~
            {money(emergencyFundTarget(income))}).
          </li>
          {recommendation && (
            <li data-testid="report-retirement-excess">
              Consider investing excess bank balance ({money(recommendation.excess)}) aligned with
              the {recommendation.riskProfileLabel} risk profile.
            </li>
          )}
          <li>Review ILP account values annually to track actual vs illustrated performance.</li>
          <li>
            Total projected retirement sum: {money(totalRetirementSum)} (ILP + bank).
          </li>
        </ol>
      </div>
    </>
  );
}
