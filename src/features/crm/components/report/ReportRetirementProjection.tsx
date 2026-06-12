/**
 * Report section [9] — combined retirement projection at age 65 (legacy
 * report/RetirementProjection.jsx:1-129 plus the ClientReportModal.jsx:429-437
 * render guard, git c09c549).
 *
 * Three gradient cards (ILP / bank / total via heroTotals), the conditional
 * bank-balance-history table, the component table with the
 * currentHoldingsTotal row, then the economic block
 * (ReportRetirementEconomics — entirely lib/financeReportEconomics math).
 * SELF-GUARDING — renders only when totalBankBalance > 0 or an ILP exists, so
 * the page composes it unconditionally. Starts on a fresh printed page
 * (.report-page-break). Formatting mirrors legacy per cell: "Current" columns
 * print UNROUNDED floats (history rows parseInt-truncate), at-65 columns are
 * Math.round'ed. Print-first light-locked per the report-print.css contract.
 */

import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { toFloat } from '../../lib/finance';
import { currentHoldingsTotal, heroTotals } from '../../lib/financeReport';
import type { CrmBankRecord, CrmClient, CrmPolicy } from '../../types';
import { ReportRetirementEconomics } from './ReportRetirementEconomics';

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;
const moneyExact = (value: number): string => `$${value.toLocaleString()}`;
/** Legacy `parseInt(v || 0).toLocaleString()` cells — truncate, never round. */
const moneyTrunc = (value: string): string => `$${Math.trunc(toFloat(value)).toLocaleString()}`;

interface ReportRetirementProjectionProps {
  client: CrmClient;
  policies: CrmPolicy[];
  /** Service-ordered (date ASC, oldest first) — rendered as delivered, matching legacy chronology. */
  bankHistory: CrmBankRecord[];
  /** summariseClient(...).income — legacy passed summary.income (line 435). */
  income: number;
  refYear: number;
}

export function ReportRetirementProjection({
  client,
  policies,
  bankHistory,
  income,
  refYear,
}: ReportRetirementProjectionProps) {
  const investmentPolicies = policies.filter((p) => p.isInvestmentLinked);
  const balance = toFloat(client.totalBankBalance);
  // ClientReportModal.jsx:429-430 — bank balance or at least one ILP required.
  if (!(balance > 0 || investmentPolicies.length > 0)) return null;

  const hero = heroTotals(
    { dateOfBirth: client.dateOfBirth, totalBankBalance: client.totalBankBalance, policies },
    refYear,
  );

  const cards = [
    {
      id: 'ilp',
      label: 'Investment-linked policies',
      value: money(hero.totalILPValueAt65),
      note: 'at age 65 (illustrated)',
    },
    {
      id: 'bank',
      label: 'Bank balance projected',
      value: money(hero.bankBalanceAt65),
      note: 'at age 65 (0.5% interest)',
    },
    {
      id: 'total',
      label: 'Total retirement sum',
      value: money(hero.totalRetirementValue),
      note: 'Combined at age 65',
    },
  ];

  return (
    <section
      className="report-section report-page-break"
      data-testid="report-retirement-projection"
    >
      <h2>Combined retirement projection (age 65)</h2>

      <div className="report-card-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`report-grad-card report-grad-card--${card.id}`}
            data-testid={`report-retirement-card-${card.id}`}
          >
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
            <div className="note">{card.note}</div>
          </div>
        ))}
      </div>

      {bankHistory.length > 0 && (
        <>
          <h3>Bank balance history</h3>
          <table className="report-table" data-testid="report-retirement-bank-history">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col" className="num">Balance</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {bankHistory.map((record) => (
                <tr key={record.id}>
                  <td>{formatDisplayDateLong(record.date)}</td>
                  <td className="num">{moneyTrunc(record.balance)}</td>
                  <td>{record.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <table className="report-table" data-testid="report-retirement-components">
        <thead>
          <tr>
            <th scope="col">Component</th>
            <th scope="col" className="num">Current</th>
            <th scope="col" className="num">Value at 65</th>
            <th scope="col">Assumption</th>
          </tr>
        </thead>
        <tbody>
          {investmentPolicies.map((policy) => (
            <tr key={policy.id} data-testid={`report-retirement-row-${policy.id}`}>
              <td>
                {policy.type} — {policy.provider}
              </td>
              <td className="num">{moneyExact(toFloat(policy.currentAccountValue))}</td>
              {/* emerald-700 (legacy #059669 ≈3.97:1) — axe AA needs 4.5:1 on white. */}
              <td className="num" style={{ color: '#047857', fontWeight: 500 }}>
                {money(toFloat(policy.illustratedValueAge65))}
              </td>
              <td>From benefit illustration</td>
            </tr>
          ))}
          <tr>
            <td>Bank balance</td>
            <td className="num">{moneyExact(balance)}</td>
            <td className="num" style={{ color: '#2563eb', fontWeight: 500 }}>
              {money(hero.bankBalanceAt65)}
            </td>
            <td>0.5% annual interest</td>
          </tr>
          <tr
            className="report-row-total report-row-total--violet"
            data-testid="report-retirement-row-total"
          >
            <td>Total</td>
            <td className="num">{moneyExact(currentHoldingsTotal(balance, investmentPolicies))}</td>
            <td className="num" style={{ color: '#7c3aed' }}>
              {money(hero.totalRetirementValue)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <ReportRetirementEconomics
        balance={balance}
        income={income}
        yearsTo65={hero.yearsToRetirement}
        ilpValueAt65={hero.totalILPValueAt65}
        bankAt65={hero.bankBalanceAt65}
        totalRetirementSum={hero.totalRetirementValue}
        riskProfile={client.riskProfile}
      />
    </section>
  );
}
