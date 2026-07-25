/**
 * Report section [8] sub-panel — Retirement Account assessment at age 55
 * (legacy report/CPFProjection.jsx:120-209, git c09c549; rendered inside
 * ReportCpfProjection only).
 *
 * Cohort line (official vs projected-at-2.5% sums), BRS/FRS/ERS row, the
 * projected-RA headline (green when FRS met, red otherwise — UNROUNDED locale
 * string like legacy), EXACTLY ONE status alert (success ≥FRS / warning ≥BRS /
 * danger below BRS — the legacy branch ladder), and the CPF LIFE payout box
 * (raw lib value, Math.round AT THE UI per lib/decisions.md). ALL math via
 * assessRetirementReadiness / retirementSumsFor / raShortfall.
 */

import type { ReactNode } from 'react';
import { retirementSumsFor } from '../../lib/finance';
import { assessRetirementReadiness, raShortfall } from '../../lib/financeReport';

const moneyExact = (value: number): string => `$${value.toLocaleString()}`;

interface ReportCpfRaPanelProps {
  /** Form-string DOB ('' = unset → legacy age-40 / fallback-cohort behavior). */
  dob: string;
  cpfOA: number;
  cpfSA: number;
  cpfMA: number;
  yearsTo55: number;
  refYear: number;
}

export function ReportCpfRaPanel({
  dob,
  cpfOA,
  cpfSA,
  cpfMA,
  yearsTo55,
  refYear,
}: ReportCpfRaPanelProps) {
  const sums = retirementSumsFor(dob, refYear);
  const ra = assessRetirementReadiness({ dob, yearsTo55, cpfOA, cpfSA, cpfMA }, refYear);

  // CPFProjection.jsx:173-192 — the alert ladder; exactly one branch renders
  // (meetsFRS implies meetsBRS since FRS > BRS in every cohort row).
  const alert: { tone: string; body: ReactNode } = ra.meetsFRS
    ? {
        tone: 'success',
        body: (
          <>
            <strong>You meet Full Retirement Sum (FRS).</strong> Can withdraw all remaining OA (
            {moneyExact(ra.remainingOA)}) at age 55.
          </>
        ),
      }
    : ra.meetsBRS
      ? {
          tone: 'warning',
          body: (
            <>
              <strong>You meet Basic Retirement Sum (BRS).</strong> Shortfall to FRS:{' '}
              {moneyExact(raShortfall(sums.frs, ra.projectedRA))}. Consider voluntary top-ups or
              property pledge.
            </>
          ),
        }
      : {
          tone: 'danger',
          body: (
            <>
              <strong>Below Basic Retirement Sum (BRS).</strong> Shortfall:{' '}
              {moneyExact(raShortfall(sums.brs, ra.projectedRA))}. Urgent: increase CPF
              contributions or top-ups.
            </>
          ),
        };

  const cohortSums = [
    { id: 'brs', label: 'BRS', value: sums.brs },
    { id: 'frs', label: 'FRS', value: sums.frs },
    { id: 'ers', label: 'ERS', value: sums.ers },
  ];

  return (
    <div className="report-ra-panel" data-testid="report-cpf-ra-panel">
      {/* Brown #806241 — the AA-safe brown for type under 18px (5.21:1 on the
          panel's card cream). Brown is the panel's accent, not a heading hue
          elsewhere in the report. */}
      <h3 style={{ color: '#806241' }}>Retirement account assessment at age 55</h3>

      <div className="report-ra-cohort">
        <div className="text-[12px]">
          <strong>Cohort: </strong>
          {sums.projected
            ? `Turning 55 in ${sums.cohortYear} (projected at 2.5%)`
            : `Turning 55 in ${sums.cohortYear} (official)`}
        </div>
        <div className="report-ra-sums">
          {cohortSums.map((sum) => (
            <div key={sum.id}>
              <div className="text-[12px]">{sum.label}</div>
              <div className="font-semibold" data-testid={`report-cpf-${sum.id}`}>
                {moneyExact(sum.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="report-ra-value">
        <div className="text-[12px] text-[color:var(--fg-dim)]">Projected Retirement Account (RA):</div>
        <div
          style={{ fontSize: 30, fontWeight: 700, color: ra.meetsFRS ? '#4a6a4e' : '#ab4925' }}
          data-testid="report-cpf-projected-ra"
        >
          {moneyExact(ra.projectedRA)}
        </div>
        <div className="text-[12px] text-[color:var(--fg-dim)]">
          (<span data-testid="report-cpf-frs-pct">{ra.frsPercentage}</span>% of FRS) · Withdrawable
          OA: {moneyExact(ra.remainingOA)}
        </div>

        <div className="mt-3 border-t border-[color:var(--border-soft)] pt-3">
          <div
            className={`report-callout report-callout--${alert.tone} mb-0`}
            data-testid="report-cpf-ra-alert"
            data-tone={alert.tone}
          >
            <p className="m-0 text-[13px]">{alert.body}</p>
          </div>
        </div>

        {ra.projectedRA > 0 && (
          <div className="report-cpf-life" data-testid="report-cpf-life">
            {/* Brown #7D5F3D — 4.75:1 on the panel's page-cream fill, so the
                11px and 12px lines clear AA. */}
            <div className="text-[12px] font-semibold" style={{ color: '#7d5f3d' }}>
              Estimated CPF LIFE monthly payout (from age 65):
            </div>
            <div
              style={{ fontSize: 22, fontWeight: 700, color: '#7d5f3d' }}
              data-testid="report-cpf-life-payout"
            >
              ${Math.round(ra.cpfLifeMonthlyPayout).toLocaleString()}/month
            </div>
            <div className="text-[11px] italic" style={{ color: '#7d5f3d' }}>
              Based on Standard Plan · At FRS, payout ≈ $1,780/month
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
