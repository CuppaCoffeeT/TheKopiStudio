/**
 * EmailThreadRow — list row for the email-inbox thread list.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-thread`)
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * States: default · hover · unread · selected · focus-visible · disabled.
 * Unread: subtle red-8 left strip (50% opacity) + bold subject + red-8 date.
 * Selected: full red-8 left strip (3px) + zinc-50 bg.
 *
 * Composes star button, read-state icon, subject line, snippet, AI-category
 * badge slot, and date. Caller controls star toggle and click-through.
 */

import { forwardRef } from 'react';
import { Star, Mail, MailOpen, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailThreadRowProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> {
  subject: string;
  /** Participant / from-name. Optional — shown inline with subject. */
  fromName?: string | null;
  snippet?: string | null;
  /** Relative or absolute formatted date (e.g. "2m ago" · "Tue, 22 Apr · 10:42"). */
  date: string;
  /** Count of messages in the thread. Renders a mono pill next to subject when >1. */
  messageCount?: number;
  isStarred?: boolean;
  isRead?: boolean;
  isSelected?: boolean;
  hasAttachment?: boolean;
  /** Slot for the AI-category badge (EmailCategoryBadge variant="badge"). */
  categoryBadge?: React.ReactNode;
  onStarToggle?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
}

export const EmailThreadRow = forwardRef<HTMLAnchorElement, EmailThreadRowProps>(
  function EmailThreadRow(
    {
      subject,
      fromName,
      snippet,
      date,
      messageCount,
      isStarred = false,
      isRead = true,
      isSelected = false,
      hasAttachment = false,
      categoryBadge,
      onStarToggle,
      onClick,
      href,
      className,
      ...props
    },
    ref,
  ) {
    const handleStarClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onStarToggle?.(e);
    };

    return (
      <a
        ref={ref}
        href={href}
        onClick={onClick}
        data-unread={!isRead}
        data-selected={isSelected}
        className={cn(
          'relative grid items-start gap-2.5 px-3.5 py-2.5',
          'grid-cols-[22px_16px_minmax(0,1fr)_auto]',
          'border-b border-border',
          'cursor-pointer no-underline',
          'transition-colors',
          'hover:bg-secondary',
          !isRead && 'bg-card',
          isSelected && 'bg-secondary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        {/* Left-strip accents */}
        {!isRead && !isSelected && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/50"
          />
        )}
        {isSelected && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
          />
        )}

        {/* Star */}
        <button
          type="button"
          onClick={handleStarClick}
          aria-label={isStarred ? 'Unstar thread' : 'Star thread'}
          className={cn(
            'pt-0.5 text-muted-foreground',
            'hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
          )}
        >
          <Star
            className={cn(
              'w-4 h-4',
              isStarred && 'fill-amber-400 text-amber-400 dark:fill-amber-400 dark:text-amber-400',
            )}
          />
        </button>

        {/* Read indicator */}
        <div className="pt-[3px]" aria-hidden>
          {isRead ? (
            <MailOpen className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Body */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13px] mb-[3px] text-foreground">
            {fromName && (
              <span className="font-medium shrink-0 max-w-[140px] truncate">
                {fromName}
              </span>
            )}
            {fromName && <span className="text-muted-foreground" aria-hidden>·</span>}
            <span
              className={cn(
                'flex-1 truncate',
                !isRead ? 'font-semibold text-foreground' : 'text-muted-foreground font-normal',
              )}
            >
              {subject || '(no subject)'}
            </span>
            {messageCount && messageCount > 1 && (
              <span
                className="text-[10px] text-muted-foreground bg-secondary px-1.5 rounded-sm tabular-nums shrink-0"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {messageCount}
              </span>
            )}
            {hasAttachment && (
              <Paperclip
                className="w-3 h-3 text-muted-foreground shrink-0"
                aria-label="Has attachment"
              />
            )}
          </div>
          <p
            className="text-[12px] text-muted-foreground leading-[1.4] overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {snippet || ''}
          </p>
        </div>

        {/* Meta: category + date */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {categoryBadge}
          <span
            className={cn(
              'text-[10.5px] tabular-nums whitespace-nowrap',
              !isRead
                ? 'text-primary font-medium'
                : 'text-muted-foreground',
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {date}
          </span>
        </div>
      </a>
    );
  },
);
