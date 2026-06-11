/**
 * StoredResultReport — the full report for a SAVED result row, composed from
 * the SAME section components the wizard's live report renders (no duplicate
 * section markup; legacy `resultHTML` order preserved). Differences vs the
 * wizard composition: no save state / login CTA / reset (wizard-only), the
 * action row lives in the DetailPageFrame hero instead, and rows without
 * replayable raw_answers swap the MBTI card for an info alert.
 *
 * The whole report carries `.print-area` (lib/print.css) so window.print()
 * emits just the report + `.rph` header, never the frame chrome.
 */

import { Alert } from '@/components/primitives/overlays/Alert';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { PR } from '../../lib/content';
import { meetingLabel } from '../../lib/meeting';
import type { ProfilerResult } from '../../types';
import { ResultHero } from '../wizard/result/ResultHero';
import { ScoreCard } from '../wizard/result/ScoreCard';
import { MbtiCard } from '../wizard/result/MbtiCard';
import { DoAvoidGrid } from '../wizard/result/DoAvoidGrid';
import { PlaybookSection } from '../wizard/result/PlaybookSection';
import {
  FollowUpCard,
  NotesCard,
  OpeningLineCard,
  StyleCard,
  TraitsCard,
} from '../wizard/result/ResultSections';
import { buildStoredReportModel } from './storedReportModel';

export function StoredResultReport({ row }: { row: ProfilerResult }) {
  const { profile, scalarOnly } = buildStoredReportModel(row);
  const p = PR[profile.pri];
  const dateLabel = formatDisplayDateLong(row.created_at);
  const meeting = meetingLabel(row.meeting);

  return (
    <div className="print-area flex flex-col gap-3" data-testid="result-detail-report">
      <div className="rph">
        <div className="rph-kicker">Prospect Profile Report</div>
        <div className="rph-name">{row.prospect_name}</div>
        <div className="rph-meta">
          Advisor: {row.advisor_name} · {dateLabel} · {meeting}
        </div>
      </div>

      <ResultHero
        profile={profile}
        prospectName={row.prospect_name}
        advisorName={row.advisor_name}
        ageRange={row.age_range ?? ''}
        occupation={row.occupation ?? ''}
        meetingLabel={meeting}
        dateLabel={dateLabel}
      />

      {scalarOnly && (
        <Alert
          variant="info"
          title="Detailed breakdown unavailable for this result"
          description="This result was saved without its raw answers, so the DISC bars show the stored totals and MBTI signal strengths cannot be reconstructed."
          className="print-hide"
        />
      )}

      <OpeningLineCard profile={p} />
      <ScoreCard profile={profile} />
      {!scalarOnly && <MbtiCard signals={profile.mb} />}
      <TraitsCard profile={p} />
      <DoAvoidGrid profile={p} />
      <StyleCard profile={p} />
      <FollowUpCard profile={p} />
      <PlaybookSection primary={profile.pri} profile={p} />
      <NotesCard notes={row.notes ?? ''} />
    </div>
  );
}
