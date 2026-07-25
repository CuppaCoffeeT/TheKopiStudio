export * from './DetailPageFrame';
export * from './PageShell';
// Component only — `PageShellStatusTone` is re-exported by ./PageShell, which
// stays the import path adopters know.
export { PageShellStatusPill } from './PageShellStatusPill';
export * from './TabNav';

// 2a dossier body vocabulary — the panels that fill PageShell's two columns.
export * from './dossier';
export * from './Timeline';
export * from './StatusTransitionModal';
export * from './RelatedRecordsCard';
export * from './ActivityLogTimeline';
export * from './SendEmailDialog';
export * from './LineItemsEditor';
export * from './DestructiveConfirmDialog';

// Email-inbox detail surfaces (detail-layer compositions + AI panels).
export { EmailDetailHeader } from './EmailDetailHeader';
export { EmailMessageCard, type EmailMessageCardParticipant, type EmailMessageCardAttachment } from './EmailMessageCard';
export { HistoryTrailList, type HistoryTrailEntry } from './HistoryTrailList';
export {
  AIPanel,
  AIPanelStatusPill,
  AIPanelActionButton,
  type AIPanelAccent,
  type AIPanelStatusTone,
} from './AIPanel';
export { AIClassificationPanel, type ReplyNeeded } from './AIClassificationPanel';
export { AIOverrideClassificationPanel, type AIOverrideOption } from './AIOverrideClassificationPanel';
export { AIDraftReplyPanel } from './AIDraftReplyPanel';

export { QuotationReferencePanel, type QuotationItemForInvoice } from './QuotationReferencePanel';
