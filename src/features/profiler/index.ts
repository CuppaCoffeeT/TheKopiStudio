/**
 * Profiler feature — public barrel (the ONLY cross-feature import surface).
 *
 * Route entries in App.tsx lazy-import page files directly for code-splitting;
 * everything else imports from here.
 */

export { default as ProfilerWizardPage } from './pages/ProfilerWizardPage';
export { default as ResultsListPage } from './pages/ResultsListPage';
export { default as ResultDetailPage } from './pages/ResultDetailPage';

export type {
  ProfilerResult,
  ProfilerResultInsert,
  ProfilerResultUpdate,
  DiscLetter,
  MbtiDimension,
  MbtiPole,
  MbtiSignal,
  QuestionPhase,
  QsOption,
  QsQuestion,
  NvItem,
  NvGroup,
  PlaybookCategoryKey,
  PlaybookCategory,
  DiscProfile,
  RawAnswer,
  LegacyResultRow,
} from './types';

// Results list surface (P4a)
export { getResultsPaginated, sanitizeSearchTerm } from './api/resultsService';
export type { ResultsListParams, ResultsPage } from './api/resultsService';
export { useResultsList } from './hooks/useResultsList';
export { DiscChip } from './components/DiscChip';
export { MEETING_LABELS, MEETING_LABELS_SHORT, meetingLabel } from './lib/meeting';
