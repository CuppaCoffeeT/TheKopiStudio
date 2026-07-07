/**
 * EmailDetailHeader — sticky glass bar for the email thread detail pane.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-right-bar`)
 * Adopters: email-inbox detail pane.
 *
 * Compact header: back button · title · message count · linked-entity pills · star.
 * Thinner than `DetailPageFrame` — the detail pane sits inside the inbox page,
 * not as a full-page chrome.
 */

import { forwardRef, type ReactNode } from 'react';
import { ChevronLeft, PanelLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailDetailHeaderProps {
  title: string;
  messageCount?: number;
  /** Slot for LinkedEntityPill components. */
  linkedEntities?: ReactNode;
  isStarred?: boolean;
  onBack?: () => void;
  onStarToggle?: () => void;
  /** Show back button. Default true. */
  showBack?: boolean;
  /** When set, renders a toggle button that hides/shows the sibling thread list (desktop only). */
  listCollapsed?: boolean;
  onToggleListCollapsed?: () => void;
  className?: string;
}

export const EmailDetailHeader = forwardRef<HTMLDivElement, EmailDetailHeaderProps>(
  function EmailDetailHeader(
    {
      title,
      messageCount,
      linkedEntities,
      isStarred = false,
      onBack,
      onStarToggle,
      showBack = true,
      listCollapsed,
      onToggleListCollapsed,
      className,
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          'sticky top-0 z-10',
          'flex items-center gap-2.5 px-4 py-2.5',
          'backdrop-blur-md bg-white/70 dark:bg-zinc-950/70',
          'border-b border-border',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {onToggleListCollapsed && listCollapsed && (
          <button
            type="button"
            onClick={onToggleListCollapsed}
            aria-label="Show thread list"
            className={cn(
              'hidden md:inline-flex w-[26px] h-[26px] items-center justify-center rounded-md shrink-0',
              'text-muted-foreground',
              'hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <PanelLeft className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to inbox"
            className={cn(
              'w-[26px] h-[26px] inline-flex items-center justify-center rounded-md shrink-0',
              'text-muted-foreground',
              'hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
        <h2 className="text-[13.5px] font-semibold text-foreground flex-1 min-w-0 truncate">
          {title}
        </h2>
        {messageCount !== undefined && messageCount > 0 && (
          <span
            className="text-[10.5px] text-muted-foreground bg-secondary px-1.5 rounded-sm tabular-nums shrink-0"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {messageCount}
          </span>
        )}
        {linkedEntities && (
          <div className="flex items-center gap-1.5 shrink-0">{linkedEntities}</div>
        )}
        {onStarToggle && (
          <button
            type="button"
            onClick={onStarToggle}
            aria-label={isStarred ? 'Unstar' : 'Star'}
            className={cn(
              'w-[26px] h-[26px] inline-flex items-center justify-center rounded-md shrink-0',
              'text-muted-foreground',
              'hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <Star
              className={cn(
                'w-3.5 h-3.5',
                isStarred &&
                  'fill-amber-400 text-amber-400 dark:fill-amber-400 dark:text-amber-400',
              )}
            />
          </button>
        )}
      </div>
    );
  },
);
