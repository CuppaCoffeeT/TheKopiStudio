/**
 * WizardFlowScreens — picks the in-flow screen for a step (prototype v6
 * `go()`): 1–2 rapport questions → 3–7 observation groups → 8 pit stop →
 * 9 discovery. Split out of `ProfilerWizardPage` (2026-09-25) when the two new
 * v6 screens would have pushed the page past the 200-LOC ceiling; the page
 * keeps the chrome, this keeps the step → screen mapping.
 */

import { RAPPORT_BATCHES } from '../../lib/content';
import type { InterimRead } from '../../lib/discovery';
import type { DiscoveryTracks, RawAnswer, TrackKey, TrackValue } from '../../types';
import { DISCOVERY_STEP, FIRST_OBSERVATION_STEP, PITSTOP_STEP } from '../../hooks/useWizardState';
import { QuestionScreen } from './QuestionScreen';
import { ObservationScreen } from './ObservationScreen';
import { PitStopScreen } from './PitStopScreen';
import { DiscoveryScreen } from './DiscoveryScreen';

interface WizardFlowScreensProps {
  step: number;
  prospectName: string;
  answers: ReadonlyArray<RawAnswer | null>;
  onSelect: (qi: number, oi: number) => void;
  nv: Record<string, boolean>;
  onToggle: (id: string) => void;
  interim: InterimRead;
  tracks: Partial<DiscoveryTracks>;
  onSelectTrack: (key: TrackKey, value: TrackValue) => void;
}

export function WizardFlowScreens({
  step,
  prospectName,
  answers,
  onSelect,
  nv,
  onToggle,
  interim,
  tracks,
  onSelectTrack,
}: WizardFlowScreensProps) {
  if (step < FIRST_OBSERVATION_STEP) {
    return (
      <QuestionScreen
        batch={RAPPORT_BATCHES[step - 1]}
        batchNumber={step as 1 | 2}
        answers={answers}
        onSelect={onSelect}
      />
    );
  }
  if (step < PITSTOP_STEP) {
    return <ObservationScreen groupIndex={step - FIRST_OBSERVATION_STEP} nv={nv} onToggle={onToggle} />;
  }
  if (step === PITSTOP_STEP) {
    return <PitStopScreen interim={interim} prospectName={prospectName} />;
  }
  if (step === DISCOVERY_STEP) {
    return (
      <DiscoveryScreen
        voice={interim.pri}
        prospectName={prospectName}
        answers={answers}
        onSelect={onSelect}
        tracks={tracks}
        onSelectTrack={onSelectTrack}
      />
    );
  }
  return null;
}
