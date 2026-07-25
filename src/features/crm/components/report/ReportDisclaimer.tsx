/**
 * Report section [13] — disclaimer + generation footer (legacy
 * ClientReportModal.jsx:548-559, git c09c549; copy ported VERBATIM).
 *
 * The inflation percentage interpolates MEDICAL_INFLATION_RATE and the BHS
 * line interpolates BHS_2026 exactly like legacy; the generated timestamp goes
 * through `formatDisplayDateTimeLong`, which pins `timeZone: Asia/Singapore`.
 * `getCurrentSingaporeTime().toLocaleString('en-SG')` — what this used to call
 * — is browser-local despite the name, so the stamp was wrong by hours off SGT
 * (see `src/features/crm/lib/lessons.md`, 2026-07-14). Page passes the
 * hero-computed currentAge / yearsToRetirement. Print-first light-locked per
 * the report-print.css contract.
 */

import { formatDisplayDateTimeLong } from '@/utils/timezoneUtils';
import { BHS_2026, MEDICAL_INFLATION_RATE } from '../../lib/finance';

interface ReportDisclaimerProps {
  currentAge: number;
  yearsToRetirement: number;
}

export function ReportDisclaimer({ currentAge, yearsToRetirement }: ReportDisclaimerProps) {
  const generatedAt = formatDisplayDateTimeLong(new Date());

  return (
    <section className="report-section" data-testid="report-disclaimer">
      <p className="m-0 border-t border-[color:var(--border-soft)] pt-3 text-[12px] text-[color:var(--fg-dim)]">
        <strong>Disclaimer:</strong> This report is for informational purposes only and does not
        constitute financial or medical advice. Medical cost projections assume{' '}
        {(MEDICAL_INFLATION_RATE * 100).toFixed(0)}% annual inflation. All recommendations should
        be reviewed with a licensed financial advisor.
      </p>
      <p className="m-0 mt-2 text-[12px] text-[color:var(--fg-dim)]">
        Report generated: {generatedAt} · Current age {currentAge}, {yearsToRetirement} years to
        retirement · BHS 2026: ${BHS_2026.toLocaleString()}
      </p>
    </section>
  );
}
