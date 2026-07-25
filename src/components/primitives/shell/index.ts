export { AppHeaderLogo } from './AppHeaderLogo';
export { AppHeaderMobileBar } from './AppHeaderMobileBar';
export { AppHeaderUserMenu, type AppHeaderUserMenuProps } from './AppHeaderUserMenu';
export { AppSidebar, SIDEBAR_OFFSET_CLASS } from './AppSidebar';
export { Breadcrumb, type BreadcrumbSegment } from './Breadcrumb';
export { ImpersonationBanner } from './ImpersonationBanner';
export { Badge, type BadgeTone, type BadgeVariant } from './Badge';
export { Button, type ButtonVariant, type ButtonSize } from './Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardTone } from './Card';
export { Chip, type ChipKind, type ChipSize } from './Chip';
export { FilterBar, type ActiveFilter } from './FilterBar';
export { FilterCard } from './FilterCard';
export { FilterDropdown, type FilterDropdownProps } from './FilterDropdown';
export { FilterPill, type FilterPillProps } from './FilterPill';
export { SearchInput, type SearchInputSize } from './SearchInput';
export { ScrollArea, ScrollBar } from './ScrollArea';
export { FloatingCTA } from './FloatingCTA';
export { LoadingSkeleton } from './LoadingSkeleton';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorState } from './ErrorState';
export { NoResultsState } from './NoResultsState';
export { PageTitle } from './PageTitle';
export { PageDescription } from './PageDescription';
export { TruncatedText } from './TruncatedText';
export { Wordmark } from './Wordmark';
export { SEO, type SEOProps } from './SEO';
export {
  NotificationsBell,
  type NotificationsBellProps,
  type NotificationsBellItem,
} from './NotificationsBell';
export {
  ViewAsSelector,
  type ViewAsSelectorProps,
  type ViewAsSelectorUser,
} from './ViewAsSelector';
export {
  ExpandableDataTable,
  type ExpandableDataTableProps,
  type EDTColumnDef,
  type EDTColumnAlign,
  type EDTSortState,
  type EDTSelectionConfig,
  type EDTEmptyState,
  type EDTErrorState,
} from './ExpandableDataTable';
export { AppHeaderShell, type AppHeaderShellProps } from './AppHeaderShell';

// Cell-level primitives for DataTable columns.
export {
  DateCell,
  DateTimeCell,
  CurrencyCell,
  NumberCell,
  type DateCellProps,
  type DateTimeCellProps,
  type CurrencyCellProps,
  type NumberCellProps,
} from './cells';

// AI / agent inbox surfaces — reusable across detail pages (quotations, projects, work permits, …).
export {
  InboxChip,
  SituationBar,
  InboxRailPanel,
  type InboxChipProps,
  type SituationBarProps,
  type InboxRailPanelProps,
} from './AIInboxRail';

// Email-inbox surfaces (shell-layer atoms) — composed by the /emailinbox feature.
export { EmailCategoryBadge, type EmailCategoryBadgeProps, type EmailCategoryBadgeVariant } from './EmailCategoryBadge';
export { AttachmentChip, type AttachmentChipKind, type AttachmentChipState } from './AttachmentChip';
export { LinkedEntityPill } from './LinkedEntityPill';
export {
  DrawingStatusBar,
  type DrawingStatusBarProps,
  type DrawingStatusCounts,
} from './DrawingStatusBar';
export { SanitizedHtmlProse, type ImagePolicy } from './SanitizedHtmlProse';
export { MarkdownProse, type MarkdownProseProps } from './MarkdownProse';
export {
  EmailSidebar,
  type EmailSidebarVariant,
  type EmailSidebarLabel,
  type EmailSidebarUserLabel,
} from './EmailSidebar';
