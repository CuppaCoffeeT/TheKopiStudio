/**
 * ResultReport — the generated profile report, sections in prototype v6's
 * `resultHTML` order (2026-09-25): print header (.rph) → hero → COMBINED READ
 * → PDF/CSV actions → login CTA → notes button → opening line → Track 1 DISC →
 * Track 2 MBTI → TRACK 3-4 temperament/openness → HORIZON & DECISION → traits
 * → Do/Avoid grid → conversation style + watch-for → follow-up style (+ the
 * TAILORED follow-up) → MEETING 2 GAME PLAN → communication playbook → notes →
 * reset. Capitalised sections are v6's and render only when `tracks` exist.
 * Print chrome handled by lib/print.css (.rph print-only, .print-hide on actions).
 */

import { useState } from 'react';
import { Button } from '@/components/primitives/shell/Button';
import { ToolNote } from '@/components/primitives/tools';
import { PR } from '../../../lib/content';
import type { ProfileResult } from '../../../lib/scoring';
import type { IntakeInfo } from '../../../hooks/useWizardState';
import type { DiscLetter, DiscoveryTracks } from '../../../types';
import { ResultHero } from './ResultHero';
import { ResultActions, type SaveState } from './ResultActions';
import { ScoreCard } from './ScoreCard';
import { MbtiCard } from './MbtiCard';
import { DoAvoidGrid } from './DoAvoidGrid';
import { PlaybookSection } from './PlaybookSection';
import { NotesModal } from './NotesModal';
import { CombinedReadCard, HorizonDecisionCard, TemperamentOpennessCard } from './TrackSections';
import { GamePlanCard, TailoredFollowUp } from './FollowUpSections';
import {
  FollowUpCard,
  NotesCard,
  OpeningLineCard,
  StyleCard,
  TraitsCard,
} from './ResultSections';

interface ResultReportProps {
  profile: ProfileResult;
  /** v6 discovery tracks (always complete for a freshly generated profile). */
  tracks: DiscoveryTracks | null;
  /** DISC letter of the money-anchor answer. */
  worry: DiscLetter | null;
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
  tracks,
  worry,
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
        tracks={tracks}
      />
      {tracks && <CombinedReadCard tracks={tracks} />}

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
      {tracks && <TemperamentOpennessCard tracks={tracks} />}
      {tracks && <HorizonDecisionCard tracks={tracks} />}
      <TraitsCard profile={p} />
      <DoAvoidGrid profile={p} />
      <StyleCard profile={p} />
      <FollowUpCard profile={p}>{tracks && <TailoredFollowUp tracks={tracks} worry={worry} />}</FollowUpCard>
      {tracks && <GamePlanCard tracks={tracks} worry={worry} />}
      <PlaybookSection primary={profile.pri} profile={p} />
      <NotesCard notes={notes} />

      {/* The tools' closing caveat line. Printed as well as shown: the PDF is
          what gets forwarded, and it is the copy most likely to be read as a
          verdict on a person rather than a read of one conversation. */}
      <ToolNote testId="result-caveat">
        This is a read, not a verdict — it reflects one conversation and what you observed in one
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
