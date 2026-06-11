export * from './DetailPageFrame';
export * from './PageShell';
export * from './TabNav';
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
