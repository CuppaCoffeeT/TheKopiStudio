/**
 * EmailComposeForm — Gmail-style compose form (new · reply · reply-all · forward).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (compose modal + drawer bodies)
 * Adopters: email-inbox feature (wrapped by `Modal` on desktop · `Drawer` on mobile).
 *
 * Distinct from `SendEmailDialog` primitive (detail/) — that ships outbound
 * quotation/invoice/statement/reminder emails. This one is for inbox
 * replies/forwards with multi-account + CC/BCC + threading awareness.
 *
 * Stateless / controlled: caller owns values + handlers. Does NOT wrap its
 * own Modal or Drawer — placement primitive is caller's responsibility.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmailComposeAccount {
  id: string;
  emailAddress: string;
  displayName?: string | null;
}

export interface EmailComposeValue {
  accountId: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

interface EmailComposeFormProps {
  /** Available "From" accounts. If only one, account picker hides. */
  accounts: EmailComposeAccount[];
  value: EmailComposeValue;
  onChange: (next: EmailComposeValue) => void;

  onSend: () => void;
  onCancel?: () => void;

  /** Disable all inputs + show "Sending…" on primary. */
  isPending?: boolean;

  /** Optional mode label shown in form header ("New Email" / "Reply" / "Reply All" / "Forward"). */
  modeLabel?: string;

  /** If CC/BCC should start expanded. */
  ccBccInitiallyOpen?: boolean;

  className?: string;
}

export function EmailComposeForm({
  accounts,
  value,
  onChange,
  onSend,
  onCancel,
  isPending = false,
  modeLabel,
  ccBccInitiallyOpen = false,
  className,
}: EmailComposeFormProps) {
  const [ccBccOpen, setCcBccOpen] = useState(
    ccBccInitiallyOpen || Boolean(value.cc || value.bcc),
  );

  const update = <K extends keyof EmailComposeValue>(key: K, next: EmailComposeValue[K]) => {
    onChange({ ...value, [key]: next });
  };

  const canSend = !isPending && value.accountId && value.to.trim().length > 0;

  return (
    <form
      className={cn('flex flex-col gap-3', className)}
      style={{ fontFamily: 'var(--font-sans)' }}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
    >
      {modeLabel && (
        <div
          className="text-[10.5px] uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {modeLabel}
        </div>
      )}

      {accounts.length > 1 && (
        <FieldWrap label="From">
          <select
            value={value.accountId}
            onChange={(e) => update('accountId', e.target.value)}
            disabled={isPending}
            className={fieldInputCls}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName ? `${a.displayName} <${a.emailAddress}>` : a.emailAddress}
              </option>
            ))}
          </select>
        </FieldWrap>
      )}

      <FieldWrap
        label="To"
        trailing={
          <button
            type="button"
            onClick={() => setCcBccOpen((o) => !o)}
            className={cn(
              'text-[10.5px] inline-flex items-center gap-0.5',
              'text-blue-700 dark:text-blue-400 hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 rounded-sm',
            )}
            aria-expanded={ccBccOpen}
          >
            CC / BCC
            {ccBccOpen ? (
              <ChevronUp className="w-3 h-3" aria-hidden />
            ) : (
              <ChevronDown className="w-3 h-3" aria-hidden />
            )}
          </button>
        }
      >
        <input
          type="text"
          value={value.to}
          onChange={(e) => update('to', e.target.value)}
          placeholder="recipient@example.com"
          disabled={isPending}
          className={fieldInputCls}
        />
      </FieldWrap>

      {ccBccOpen && (
        <>
          <FieldWrap label="CC">
            <input
              type="text"
              value={value.cc}
              onChange={(e) => update('cc', e.target.value)}
              placeholder="cc@example.com"
              disabled={isPending}
              className={fieldInputCls}
            />
          </FieldWrap>
          <FieldWrap label="BCC">
            <input
              type="text"
              value={value.bcc}
              onChange={(e) => update('bcc', e.target.value)}
              placeholder="bcc@example.com"
              disabled={isPending}
              className={fieldInputCls}
            />
          </FieldWrap>
        </>
      )}

      <FieldWrap label="Subject">
        <input
          type="text"
          value={value.subject}
          onChange={(e) => update('subject', e.target.value)}
          placeholder="Subject"
          disabled={isPending}
          className={fieldInputCls}
        />
      </FieldWrap>

      <FieldWrap label="Message">
        <textarea
          value={value.body}
          onChange={(e) => update('body', e.target.value)}
          placeholder="Write your message…"
          rows={8}
          disabled={isPending}
          className={cn(fieldInputCls, 'min-h-[200px] resize-y py-2')}
        />
      </FieldWrap>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={cn(
              'h-8 px-3 rounded-md inline-flex items-center gap-1.5 text-[12.5px]',
              'text-zinc-600 dark:text-zinc-400',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <X className="w-3.5 h-3.5" aria-hidden />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            'h-8 px-3.5 rounded-md inline-flex items-center gap-1.5 text-[12.5px] font-medium',
            'bg-slate-800 hover:bg-slate-900 text-white',
            'dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <Send className="w-3.5 h-3.5" aria-hidden />
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  );
}

const fieldInputCls = cn(
  'w-full h-8 px-2.5 rounded-md border text-[12.5px]',
  'bg-white dark:bg-zinc-950',
  'border-zinc-200 dark:border-zinc-800',
  'text-zinc-900 dark:text-zinc-100',
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
  'disabled:opacity-60 disabled:cursor-not-allowed',
);

function FieldWrap({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between">
        <span
          className="text-[9.5px] uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </span>
        {trailing}
      </div>
      {children}
    </div>
  );
}
