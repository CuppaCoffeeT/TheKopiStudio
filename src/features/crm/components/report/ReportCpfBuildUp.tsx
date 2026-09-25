/**
 * Report section [8] insert (v42, 2026-09-25) — what the CPF projection was
 * built from, and how OA and SA get from today's balance to their value at 55.
 *
 * Two blocks, both self-guarding: the basis callout (only when contributions
 * or a housing loan moved the numbers) and the OA/SA waterfall — starting
 * balance, + contributions, − housing loan, + Medisave overflow, + interest,
 * = value at 55. Interest is DERIVED in lib/cpfBuildUp so the column always
 * reconciles. Formatting only here.
 */

import { cpfBuildUp, type ClientCpfPlan, type CpfBuildUpLine } from '../../lib/cpfBuildUp';
import type { CpfWithContributionsProjection } from '../../lib/cpfContributions';

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;

interface ReportCpfBuildUpProps {
  plan: ClientCpfPlan;
  projection: CpfWithContributionsProjection;
  cpfOA: number;
  cpfSA: number;
  yearsTo55: number;
}

function Waterfall({ label, rate, line, endAge }: {
  label: string; rate: string; line: CpfBuildUpLine; endAge: number | null;
}) {
  const rows: [string, string, boolean?][] = [['Starting balance today', money(line.start)]];
  if (line.contributions > 0) rows.push(['Plus CPF contributions to age 55', `+${money(line.contributions)}`]);
  if (line.housing > 0) {
    rows.push([`Less housing loan payments${endAge ? ` (until age ${endAge})` : ''}`, `−${money(line.housing)}`, true]);
  }
  if (line.overflow > 0) rows.push(['Plus Medisave overflow (excess over the cap)', `+${money(line.overflow)}`]);
  rows.push(['Plus interest earned', `+${money(line.interest)}`]);

  return (
    <>
      {rows.map(([text, amount, loss], i) => (
        <tr key={text}>
          {i === 0 && <td rowSpan={rows.length + 1}><strong>{label}</strong></td>}
          <td>{text}</td>
          {i === 0 && <td rowSpan={rows.length + 1} className="num">{rate}</td>}
          <td className="num" style={loss ? { color: '#8F3D1F' } : undefined}>{amount}</td>
        </tr>
      ))}
      <tr className="report-row-total">
        <td>Value at age 55</td>
        <td className="num">{money(line.at55)}</td>
      </tr>
    </>
  );
}

export function ReportCpfBuildUp({ plan, projection, cpfOA, cpfSA, yearsTo55 }: ReportCpfBuildUpProps) {
  const build = cpfBuildUp({ cpfOA, cpfSA }, projection);
  const endAge = plan.housing?.endAge ?? null;
  const housing = projection.totalHousingDeducted;

  return (
    <>
      {(projection.totalFutureContributions > 0 || housing > 0) && (
        <div className="report-callout" data-testid="report-cpf-contributions">
          {projection.totalFutureContributions > 0 && (
            <p className="m-0">
              <strong>Future contributions included.</strong> Approximately{' '}
              {money(projection.totalFutureContributions)} of CPF contributions over the next{' '}
              {yearsTo55} {yearsTo55 === 1 ? 'year' : 'years'}, on income capped at the $
              {(8_000).toLocaleString()} monthly Ordinary Wage ceiling, based on{' '}
              {plan.incomeBasis === 'tiers'
                ? plan.incomeSteps
                    .map((s) => `age ${s.startAge}–${s.endAge}: ${money(s.annualIncome)}/year`)
                    .join('; ')
                : `an estimated average income of ${money(plan.avgIncomeTo55 ?? 0)}/year until age 55`}
              .
            </p>
          )}
          {housing > 0 && (
            <p className="m-0 mt-1" data-testid="report-cpf-housing">
              <strong>{money(housing)}</strong> is deducted from OA over the years for the housing
              loan{endAge ? ` (until age ${endAge})` : ' (until age 55)'}. This keeps the OA and CPF
              LIFE figures realistic.
            </p>
          )}
        </div>
      )}

      <table className="report-table" data-testid="report-cpf-buildup">
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">How it builds up</th>
            <th scope="col" className="num">Rate</th>
            <th scope="col" className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          <Waterfall label="Ordinary Account (OA)" rate="2.5%" line={build.oa} endAge={endAge} />
          <Waterfall label="Special Account (SA)" rate="4.0%" line={build.sa} endAge={endAge} />
        </tbody>
      </table>
    </>
  );
}
