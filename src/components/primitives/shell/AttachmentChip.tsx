/**
 * AttachmentChip — downloadable file chip (filename + size + download icon).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-att`)
 * Adopters: EmailMessageCard, SendEmailDialog (existing detail primitive — deduplicates inline variant).
 *
 * States:
 *   - idle (default) — paperclip icon, filename, size, chevron-down or download icon
 *   - loading — spinner icon, opacity 0.7
 *   - error — red tint, alert icon
 */

import { forwardRef } from 'react';
import { Paperclip, Download, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AttachmentChipKind = 'pdf' | 'xlsx' | 'doc' | 'img' | 'other';
export type AttachmentChipState = 'idle' | 'loading' | 'error';

interface AttachmentChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  filename: string;
  /** Pre-formatted size string (e.g. "1.2 MB"). */
  size?: string | null;
  kind?: AttachmentChipKind;
  state?: AttachmentChipState;
}

export const AttachmentChip = forwardRef<HTMLButtonElement, AttachmentChipProps>(
  function AttachmentChip(
    { filename, size, kind: _kind, state = 'idle', className, disabled, ...props },
    ref,
  ) {
    const isLoading = state === 'loading';
    const isError = state === 'error';
    const LeadingIcon = isError ? AlertCircle : Paperclip;
    const TrailingIcon = isLoading ? Loader2 : Download;
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center gap-2 h-[30px] pl-2 pr-2.5 rounded-lg border',
          'text-[11.5px] font-medium whitespace-nowrap',
          'transition-colors',
          isError
            ? 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900',
          isLoading && 'opacity-70 cursor-wait',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        <LeadingIcon
          className={cn(
            'w-4 h-4 shrink-0',
            isError ? 'text-red-700 dark:text-red-300' : 'text-zinc-500 dark:text-zinc-400',
          )}
          aria-hidden
        />
        <span className="truncate max-w-[220px]">{filename}</span>
        {size && (
          <span
            className="text-[10px] text-zinc-500 dark:text-zinc-400 tabular-nums"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {size}
          </span>
        )}
        <TrailingIcon
          className={cn(
            'w-3 h-3 shrink-0 opacity-70',
            isLoading && 'animate-spin',
          )}
          aria-hidden
        />
      </button>
    );
  },
);
