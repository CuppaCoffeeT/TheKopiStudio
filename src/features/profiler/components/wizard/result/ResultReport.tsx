/**
 * ResultReport — the generated profile report, sections in EXACT legacy order
 * (`resultHTML`): print header (.rph) → hero → PDF/CSV actions → login CTA →
 * notes button → opening line → DISC score card → MBTI dims → traits →
 * Do/Avoid grid → conversation style + watch-for → follow-up style →
 * communication playbook → notes → reset. Print chrome handled by
 * lib/print.css (.rph print-only, .print-hide on actions).
 */

import { useState } from 'react';
import { Button } from '@/components/primitives/shell/Button';
import { ToolNote } from '@/components/primitives/tools';
import { PR } from '../../../lib/content';
import type { ProfileResult } from '../../../lib/scoring';
import type { IntakeInfo } from '../../../hooks/useWizardState';
import { ResultHero } from './ResultHero';
import { ResultActions, type SaveState } from './ResultActions';
import { ScoreCard } from './ScoreCard';
import { MbtiCard } from './MbtiCard';
import { DoAvoidGrid } from './DoAvoidGrid';
import { PlaybookSection } from './PlaybookSection';
import { NotesModal } from './NotesModal';
import {
  FollowUpCard,
  NotesCard,
  OpeningLineCard,
  StyleCard,
  TraitsCard,
} from './ResultSections';

interface ResultReportProps {
  profile: ProfileResult;
  /** Effective intake (name defaults already applied). */
  intake: IntakeInfo;
  meetingLabel: string;
  /** Display date (en-SG, e.g. "11 Jun 2026"). */
  dateLabel: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  isAuthenticated: boolean;
  saveState: SaveState;
  onPdf: () => void;
  onCsv: () => void;
  onReset: () => void;
}

export function ResultReport({
  profile,
  intake,
  meetingLabel,
  dateLabel,
  notes,
  onNotesChange,
  isAuthenticated,
  saveState,
  onPdf,
  onCsv,
  onReset,
}: ResultReportProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const p = PR[profile.pri];

  return (
    <div className="flex flex-col gap-3" data-testid="wizard-result-report">
      {/* Print-only report header (legacy .rph) */}
      <div className="rph">
        <div className="rph-kicker">Prospect Profile Report</div>
        <div className="rph-name">{intake.name}</div>
        <div className="rph-meta">
          Advisor: {intake.adv} · {dateLabel} · {meetingLabel}
        </div>
      </div>

      <ResultHero
        profile={profile}
        prospectName={intake.name}
        advisorName={intake.adv}
        ageRange={intake.age}
        occupation={intake.occ}
        meetingLabel={meetingLabel}
        dateLabel={dateLabel}
      />

      <ResultActions
        onPdf={onPdf}
        onCsv={onCsv}
        onOpenNotes={() => setNotesOpen(true)}
        isAuthenticated={isAuthenticated}
        saveState={saveState}
      />

      <OpeningLineCard profile={p} />
      <ScoreCard profile={profile} />
      <MbtiCard signals={profile.mb} />
      <TraitsCard profile={p} />
      <DoAvoidGrid profile={p} />
      <StyleCard profile={p} />
      <FollowUpCard profile={p} />
      <PlaybookSection primary={profile.pri} profile={p} />
      <NotesCard notes={notes} />

      {/* The tools' closing caveat line. Printed as well as shown: the PDF is
          what gets forwarded, and it is the copy most likely to be read as a
          verdict on a person rather than a read of one conversation. */}
      <ToolNote testId="result-caveat">
        This is a read, not a verdict — it reflects eight answers and what you observed in one
        meeting. Expect it to shift as you learn more.
      </ToolNote>

      <Button
        size="lg"
        variant="outline"
        className="print-hide w-full"
        onClick={onReset}
        data-testid="result-reset-btn"
      >
        ← Profile Another Prospect
      </Button>

      <NotesModal open={notesOpen} onOpenChange={setNotesOpen} notes={notes} onSave={onNotesChange} />
    </div>
  );
}
