/**
 * Report section [8] — CPF projection to age 55 (legacy report/CPFProjection.jsx
 * plus the ClientReportModal.jsx:423-427 render guard, git c09c549).
 *
 * PER-ACCOUNT table to age 55 (NOT year-by-year): Medisave-overflow alert
 * (BHS cap + SA boost via projectCPFTo55), three at-55 gradient cards, the
 * OA/SA/MA account table with the cpfCurrentTotal row, then the RA assessment
 * panel (ReportCpfRaPanel). SELF-GUARDING — renders only when any CPF balance
 * is > 0, so the page composes it unconditionally. Starts on a fresh printed
 * page (.report-page-break). ALL math from lib; only locale formatting here:
 * "Current" cells print UNROUNDED floats exactly like legacy, at-55 cells are
 * Math.round'ed. Print-first light-locked per the report-print.css contract.
 */

import { projectCPFTo55WithFutureContributions } from '../../lib/cpfContributions';
import { incomeStepsFromClient } from '../../lib/incomeSteps';
import { BHS_2026, toFloat } from '../../lib/finance';
import { cpfCurrentTotal } from '../../lib/financeReport';
import type { CrmClient } from '../../types';
import { ReportCpfRaPanel } from './ReportCpfRaPanel';

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;
const moneyExact = (value: number): string => `$${value.toLocaleString()}`;

interface ReportCpfProjectionProps {
  client: CrmClient;
  /** Page-computed ageFromDOB (legacy passed currentAge into CPFProjection). */
  currentAge: number;
  refYear: number;
}

export function ReportCpfProjection({ client, currentAge, refYear }: ReportCpfProjectionProps) {
  const cpfOA = toFloat(client.cpfOA);
  const cpfSA = toFloat(client.cpfSA);
  const cpfMA = toFloat(client.cpfMA);
  // ClientReportModal.jsx:423-425 — the section exists only when a CPF balance is recorded.
  if (!(cpfOA > 0 || cpfSA > 0 || cpfMA > 0)) return null;

  // CPFProjection.jsx:8 — years-to-55 clamp (year count, not money math).
  const yearsTo55 = Math.max(0, 55 - currentAge);

  // Contributions-aware since 2026-07-28. With no income steps on the record
  // this is FLOAT-EXACTLY the legacy `projectCPFTo55` (asserted in
  // lib/__tests__/cpfContributions.test.ts), so an un-filled customer's report
  // is unchanged; a customer WITH steps finally has their future
  // contributions counted instead of only their current balances growing.
  const incomeSteps = incomeStepsFromClient(client);
  const projection = projectCPFTo55WithFutureContributions({
    cpfOA,
    cpfSA,
    cpfMA,
    currentAge,
    incomeSteps,
  });

  const cards = [
    {
      id: 'oa',
      label: 'Ordinary Account (OA)',
      value: money(projection.oaAt55),
      note: 'at age 55 (2.5% p.a.)',
    },
    {
      id: 'sa',
      label: 'Special Account (SA)',
      value: money(projection.saAt55),
      note: '→ Retirement Account at 55 (4% p.a.)',
    },
    {
      id: 'ma',
      label: 'Medisave (MA)',
      value: money(projection.maAt55),
      note: 'for healthcare (4% p.a.)',
    },
  ];

  const rows = [
    {
      id: 'oa',
      label: 'OA',
      current: cpfOA,
      rate: '2.5%',
      at55: projection.oaAt55,
      purpose: 'Withdrawable for personal use',
    },
    {
      id: 'sa',
      label: 'SA',
      current: cpfSA,
      rate: '4.0%',
      at55: projection.saAt55,
      purpose: 'Converts to RA for CPF LIFE',
    },
    {
      id: 'ma',
      label: 'MA',
      current: cpfMA,
      rate: '4.0%',
      at55: projection.maAt55,
      purpose: 'Healthcare expenses',
    },
  ];

  return (
    <section className="report-section report-page-break" data-testid="report-cpf-projection">
      <h2>CPF projection to age 55</h2>
      <p className="text-[12px] text-[color:var(--fg-dim)]">
        Projection based on current CPF interest rates (OA: 2.5%, SA: 4%, MA: 4%) with Medisave
        cap overflow to SA.
        {incomeSteps.length > 0
          ? ' Future CPF contributions are included, from the expected income recorded on the customer.'
          : ' Existing balances only — no future income is recorded, so no further contributions are assumed.'}
      </p>

      {projection.totalFutureContributions > 0 && (
        <div className="report-callout" data-testid="report-cpf-contributions">
          <strong>Future contributions included.</strong> Approximately{' '}
          {money(projection.totalFutureContributions)} of CPF contributions over the next{' '}
          {yearsTo55} {yearsTo55 === 1 ? 'year' : 'years'}, on income capped at the $
          {(8_000).toLocaleString()} monthly Ordinary Wage ceiling.
        </div>
      )}

      {projection.totalOverflow > 0 && (
        <div className="report-callout report-callout--warning" data-testid="report-cpf-overflow">
          <strong>Medisave overflow detected.</strong> Medisave will hit the BHS 2026 cap of{' '}
          {moneyExact(BHS_2026)}. Approx {money(projection.totalOverflow)} will overflow to the
          Special Account, boosting SA by {money(projection.saBoostFromOverflow)} at age 55.
        </div>
      )}

      <div className="report-card-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`report-grad-card report-grad-card--${card.id}`}
            data-testid={`report-cpf-card-${card.id}`}
          >
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
            <div className="note">{card.note}</div>
          </div>
        ))}
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col" className="num">Current</th>
            <th scope="col" className="num">Rate</th>
            <th scope="col" className="num">Years to 55</th>
            <th scope="col" className="num">Value at 55</th>
            <th scope="col">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-testid={`report-cpf-row-${row.id}`}>
              <td>
                <strong>{row.label}</strong>
              </td>
              <td className="num">{moneyExact(row.current)}</td>
              <td className="num">{row.rate}</td>
              <td className="num">{yearsTo55}</td>
              <td className="num">{money(row.at55)}</td>
              <td>{row.purpose}</td>
            </tr>
          ))}
          <tr
            className="report-row-total report-row-total--green"
            data-testid="report-cpf-row-total"
          >
            <td>Total</td>
            <td className="num">{moneyExact(cpfCurrentTotal(cpfOA, cpfSA, cpfMA))}</td>
            <td />
            <td />
            <td className="num">{money(projection.totalCPFAt55)}</td>
            <td />
          </tr>
        </tbody>
      </table>

      <ReportCpfRaPanel
        dob={client.dateOfBirth}
        cpfOA={cpfOA}
        cpfSA={cpfSA}
        cpfMA={cpfMA}
        yearsTo55={yearsTo55}
        refYear={refYear}
      />
    </section>
  );
}
