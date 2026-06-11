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
