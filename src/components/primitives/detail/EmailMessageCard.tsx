/**
 * EmailMessageCard — expandable message card inside a thread detail pane.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-msg · .ei-msg-hd · .ei-msg-body · .ei-msg-actions`)
 * Adopters: email-inbox detail pane.
 *
 * States: collapsed (shows sender, time, snippet) · expanded (full body +
 * recipients + attachments + reply actions). Shadcnblocks-clean card shape
 * (16px radius · zinc-200/80 border · rest-shadow).
 *
 * Body rendering delegated to `SanitizedHtmlProse` primitive — supports inline
 * images via `cidMap`, external image policy, and sanitization.
 */

import { forwardRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Paperclip, Reply, ReplyAll, Forward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SanitizedHtmlProse, type ImagePolicy } from '@/components/primitives/shell/SanitizedHtmlProse';

export interface EmailMessageCardParticipant {
  role: 'from' | 'to' | 'cc' | 'bcc' | 'reply-to';
  emailAddress: string;
  displayName?: string | null;
}

export interface EmailMessageCardAttachment {
  id: string;
  filename: string;
  /** Human-readable size, e.g. "1.2 MB". */
  size?: string | null;
}

interface EmailMessageCardProps {
  /** Sender display name. */
  fromName: string;
  /** Sender email address (monospace, shown next to name). */
  fromEmail: string;
  /** Avatar bg color (slate-700 by default). Accepts any CSS color. */
  avatarColor?: string;
  /** Initials shown inside avatar circle. 1–2 chars. */
  avatarInitials: string;
  /** Absolute or relative formatted timestamp (e.g. "Mon, 21 Apr · 09:47"). */
  formattedTime: string;
  /** Snippet shown when collapsed. */
  snippet?: string | null;

  /** All participants. Expanded card groups by role. */
  participants: EmailMessageCardParticipant[];

  /** Sanitized HTML body. */
  bodyHtml?: string | null;
  /** Plaintext fallback when body_html is empty. */
  bodyPlain?: string | null;
  /** CID map for inline images. Feature-layer `useInlineCidMap` resolves this. */
  cidMap?: Record<string, string>;
  /** External image policy. Default `"prompt"`. */
  imagePolicy?: ImagePolicy;
  onLoadImages?: () => void;

  /** Non-inline attachments rendered as `AttachmentChip` chips. */
  attachmentsSlot?: ReactNode;

  /** Reply actions. Called without args; caller closes over message. */
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;

  /** Default expand state. */
  defaultExpanded?: boolean;
  /** Controlled expand state. If provided, card is controlled. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;

  className?: string;
}

function participantsByRole(list: EmailMessageCardParticipant[], role: EmailMessageCardParticipant['role']) {
  return list.filter((p) => p.role === role);
}

function formatParticipant(p: EmailMessageCardParticipant) {
  return p.displayName?.trim() || p.emailAddress;
}

export const EmailMessageCard = forwardRef<HTMLDivElement, EmailMessageCardProps>(
  function EmailMessageCard(
    {
      fromName,
      fromEmail,
      avatarColor,
      avatarInitials,
      formattedTime,
      snippet,
      participants,
      bodyHtml,
      bodyPlain,
      cidMap,
      imagePolicy = 'prompt',
      onLoadImages,
      attachmentsSlot,
      onReply,
      onReplyAll,
      onForward,
      defaultExpanded = false,
      expanded: expandedProp,
      onExpandedChange,
      className,
    },
    ref,
  ) {
    const [uncontrolled, setUncontrolled] = useState(defaultExpanded);
    const isControlled = expandedProp !== undefined;
    const expanded = isControlled ? expandedProp : uncontrolled;
    const toggle = () => {
      const next = !expanded;
      if (!isControlled) setUncontrolled(next);
      onExpandedChange?.(next);
    };

    const toList = participantsByRole(participants, 'to');
    const ccList = participantsByRole(participants, 'cc');
    const bccList = participantsByRole(participants, 'bcc');

    return (
      <article
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl border',
          'bg-white dark:bg-zinc-950',
          'border-zinc-200/80 dark:border-zinc-800/80',
          'shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        data-expanded={expanded}
      >
        {/* Header (clickable to toggle) */}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className={cn(
            'w-full text-left flex items-start gap-3 px-4 py-3 cursor-pointer',
            'hover:bg-zinc-50/60 dark:hover:bg-zinc-900/60 transition-colors',
            expanded && 'border-b border-zinc-100 dark:border-zinc-800/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-700 dark:focus-visible:ring-red-400',
          )}
        >
          <span
            aria-hidden
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-[11px] font-semibold shrink-0"
            style={{ background: avatarColor ?? 'var(--slate-700, #334155)' }}
          >
            {avatarInitials}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {fromName}
              </span>
              <span
                className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                &lt;{fromEmail}&gt;
              </span>
            </div>
            {!expanded && snippet && (
              <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {snippet}
              </p>
            )}
            {expanded && toList.length > 0 && (
              <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                to {toList.map(formatParticipant).join(', ')}
                {ccList.length > 0 && ` · cc ${ccList.map(formatParticipant).join(', ')}`}
                {bccList.length > 0 && ` · bcc ${bccList.map(formatParticipant).join(', ')}`}
              </p>
            )}
          </div>
          <span
            className="text-[10.5px] text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5 tabular-nums"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {formattedTime}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" aria-hidden />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" aria-hidden />
          )}
        </button>

        {expanded && (
          <div className="px-4 py-3.5">
            {/* Recipients detail */}
            {(toList.length > 0 || ccList.length > 0 || bccList.length > 0) && (
              <dl
                className={cn(
                  'grid gap-x-2.5 gap-y-0.5 text-[11.5px] pb-2.5 mb-2.5',
                  'grid-cols-[40px_minmax(0,1fr)]',
                  'border-b border-dashed border-zinc-100 dark:border-zinc-800/60',
                  'text-zinc-600 dark:text-zinc-400',
                )}
              >
                {toList.length > 0 && (
                  <>
                    <dt
                      className="text-[10px] uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-500"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      To
                    </dt>
                    <dd className="min-w-0 break-words">
                      {toList.map(formatParticipant).join(', ')}
                    </dd>
                  </>
                )}
                {ccList.length > 0 && (
                  <>
                    <dt
                      className="text-[10px] uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-500"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      CC
                    </dt>
                    <dd className="min-w-0 break-words">
                      {ccList.map(formatParticipant).join(', ')}
                    </dd>
                  </>
                )}
                {bccList.length > 0 && (
                  <>
                    <dt
                      className="text-[10px] uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-500"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      BCC
                    </dt>
                    <dd className="min-w-0 break-words">
                      {bccList.map(formatParticipant).join(', ')}
                    </dd>
                  </>
                )}
              </dl>
            )}

            {/* Body */}
            {bodyHtml ? (
              <SanitizedHtmlProse
                html={bodyHtml}
                cidMap={cidMap}
                imagePolicy={imagePolicy}
                onLoadImages={onLoadImages}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-[13px] leading-[1.6] text-zinc-700 dark:text-zinc-300 font-sans">
                {bodyPlain ?? '(no content)'}
              </pre>
            )}

            {/* Attachments */}
            {attachmentsSlot && (
              <div className="mt-3 pt-3 border-t border-dashed border-zinc-100 dark:border-zinc-800/60">
                <div
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400 mb-2"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <Paperclip className="w-3 h-3" aria-hidden />
                  <span>Attachments</span>
                </div>
                <div className="flex flex-wrap gap-1.5">{attachmentsSlot}</div>
              </div>
            )}

            {/* Reply actions */}
            {(onReply || onReplyAll || onForward) && (
              <div className="mt-3.5 pt-3 border-t border-dashed border-zinc-100 dark:border-zinc-800/60 flex flex-wrap gap-1.5">
                {onReply && (
                  <MessageActionButton icon={<Reply className="w-3.5 h-3.5" />} onClick={onReply}>
                    Reply
                  </MessageActionButton>
                )}
                {onReplyAll && (
                  <MessageActionButton
                    icon={<ReplyAll className="w-3.5 h-3.5" />}
                    onClick={onReplyAll}
                  >
                    Reply all
                  </MessageActionButton>
                )}
                {onForward && (
                  <MessageActionButton
                    icon={<Forward className="w-3.5 h-3.5" />}
                    onClick={onForward}
                  >
                    Forward
                  </MessageActionButton>
                )}
              </div>
            )}
          </div>
        )}
      </article>
    );
  },
);

function MessageActionButton({
  icon,
  onClick,
  children,
}: {
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-2.5 rounded-md inline-flex items-center gap-1.5',
        'text-[12px] text-zinc-700 dark:text-zinc-300',
        'border border-zinc-200 dark:border-zinc-800',
        'bg-white dark:bg-zinc-950',
        'hover:bg-zinc-50 dark:hover:bg-zinc-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {icon}
      {children}
    </button>
  );
}
