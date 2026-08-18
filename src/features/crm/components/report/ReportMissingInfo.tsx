/**
 * Report section [0] — what this report could not fill in.
 *
 * Printed FIRST, above the hero, and only when something is actually missing.
 * It is the replacement for the old lock on the report: rather than refusing to
 * generate until the record is complete, the report generates and says plainly
 * what is not known yet and which tool supplies it. In a first meeting that
 * list is the agenda.
 *
 * It prints. This is deliberate — a customer holding a report with `NIL` in it
 * should be able to read why, and the advisor should not have to remember.
 * Print-first light-locked per report-print.css.
 */

import type { ReportGap } from '../../lib/reportCompleteness';

export function ReportMissingInfo({ gaps }: { gaps: readonly ReportGap[] }) {
  if (gaps.length === 0) return null;

  return (
    <section className="report-section" data-testid="report-missing-info">
      <h2>Missing information</h2>
      <div className="rounded-lg bg-card p-4">
        <p className="m-0 mb-2.5 text-[13px]">
          {gaps.length === 1
            ? 'One field has nothing on file yet. It prints as NIL below.'
            : `${gaps.length} fields have nothing on file yet. They print as NIL below.`}
        </p>
        <ul className="m-0 list-none space-y-1 p-0">
          {gaps.map((gap) => (
            <li key={gap.field} className="text-[13px]">
              <strong>{gap.field}:</strong> {gap.remedy}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
