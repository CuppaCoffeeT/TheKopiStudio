/**
 * SendEmailDialog — Unified email composer (quotation · invoice · statement · reminder).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-send-email.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/detail/SendEmailDialog.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Composes: <Modal> (size="xl") + native controls.
 * Locked:
 *  - Quotation variant only shows the "Update quotation date" toggle.
 *  - Template picker + recipients row + subject + body + attachments + optional date toggle.
 *  - Body textarea uses Roboto 14px (readable copy), NOT mono.
 */

import { useState, type ReactNode } from 'react';
import { Eye, Clock, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, ModalGhostAction } from '../overlays/Modal';

export type SendEmailVariant = 'quotation' | 'invoice' | 'statement' | 'reminder';

export type SendEmailRecipient = {
  value: string;
  label: string;
  sub?: string;
};

export type SendEmailAttachment = {
  id: string;
  name: string;
  size: string;
  kind?: 'pdf' | 'xlsx' | 'doc' | 'img';
};

export type SendEmailTemplate = {
  key: string;
  label: string;
};

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  variant?: SendEmailVariant;
  recordLabel: string;
  recipientOrganization?: string;
  template?: SendEmailTemplate;
  onTemplateClick?: () => void;
  to: SendEmailRecipient[];
  cc?: SendEmailRecipient[];
  bcc?: SendEmailRecipient[];
  onRemoveRecipient?: (field: 'to' | 'cc' | 'bcc', value: string) => void;
  onAddRecipient?: (field: 'to' | 'cc' | 'bcc', raw: string) => void;
  subject: string;
  onSubjectChange?: (next: string) => void;
  body: string;
  onBodyChange?: (next: string) => void;
  attachments?: SendEmailAttachment[];
  onRemoveAttachment?: (id: string) => void;
  /** Quotation variant only. */
  updateDate?: boolean;
  onUpdateDateChange?: (next: boolean) => void;
  updateDateLabel?: string;
  updateDateDescription?: string;
  onPreview?: () => void;
  onSendLater?: () => void;
  onSend: () => void;
  sending?: boolean;
}

const VARIANT_TITLE: Record<SendEmailVariant, string> = {
  quotation: 'send quotation',
  invoice: 'send invoice',
  statement: 'send statement',
  reminder: 'send reminder',
};

export function SendEmailDialog(props: SendEmailDialogProps) {
  const {
    open,
    onOpenChange,
    variant = 'quotation',
    recordLabel,
    recipientOrganization,
    template,
    onTemplateClick,
    to,
    cc = [],
    bcc = [],
    onRemoveRecipient,
    onAddRecipient,
    subject,
    onSubjectChange,
    body,
    onBodyChange,
    attachments = [],
    onRemoveAttachment,
    updateDate,
    onUpdateDateChange,
    updateDateLabel = 'Update record date to today',
    updateDateDescription,
    onPreview,
    onSendLater,
    onSend,
    sending = false,
  } = props;

  const [ccOpen, setCcOpen] = useState(cc.length > 0 || bcc.length > 0);
  const isQuote = variant === 'quotation';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={VARIANT_TITLE[variant]}
      description={
        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[11px] tracking-wide">
          {recordLabel}
          {recipientOrganization && (
            <>
              <span className="text-zinc-400 dark:text-zinc-600 mx-1.5">·</span>
              {recipientOrganization}
            </>
          )}
        </span>
      }
      size="xl"
      footer={
        <>
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'h-8 px-3 rounded-md inline-flex items-center gap-1.5',
                'text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300',
                'bg-transparent border border-zinc-200 dark:border-zinc-800',
                'hover:bg-white dark:hover:bg-zinc-900',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700'
              )}
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          )}
          <div className="flex-1" />
          <ModalGhostAction onClick={() => onOpenChange(false)}>Cancel</ModalGhostAction>
          {onSendLater && (
            <ModalGhostAction onClick={onSendLater}>
              <Clock className="w-2.5 h-2.5 inline mr-1" /> Send later
            </ModalGhostAction>
          )}
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className={cn(
              'h-8 px-3.5 rounded-md inline-flex items-center gap-1.5 text-[13px] font-medium',
              'bg-slate-800 hover:bg-slate-900 text-white',
              'dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2'
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <Send className="w-3 h-3" />
            {sending ? 'Sending…' : 'Send now'}
          </button>
        </>
      }
    >
      {/* Template */}
      {template && (
        <Field label="template">
          <button
            type="button"
            onClick={onTemplateClick}
            className={cn(
              'w-full h-[34px] px-2.5 flex items-center gap-2',
              'rounded-md border border-zinc-200 dark:border-zinc-800',
              'bg-zinc-50 dark:bg-zinc-900 text-[13px] text-zinc-900 dark:text-zinc-50',
              'hover:border-zinc-300 dark:hover:border-zinc-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700'
            )}
          >
            <span
              className="text-[10.5px] px-1.5 py-0.5 rounded-[3px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 tracking-wider"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {template.key}
            </span>
            <span className="text-zinc-500 text-[12.5px]">{template.label}</span>
          </button>
        </Field>
      )}

      {/* Recipients */}
      <div>
        <div className="flex items-center gap-2">
          <FieldLabel>to · recipients</FieldLabel>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setCcOpen((v) => !v)}
            className="text-[10.5px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 tracking-wide"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {ccOpen ? '− hide cc/bcc' : '+ cc / bcc'}
          </button>
        </div>
        <RecipientRow field="to" list={to} onRemove={onRemoveRecipient} onAdd={onAddRecipient} />
        {ccOpen && (
          <div className="mt-2 grid gap-2">
            <RecipientRow field="cc" list={cc} onRemove={onRemoveRecipient} onAdd={onAddRecipient} />
            <RecipientRow field="bcc" list={bcc} onRemove={onRemoveRecipient} onAdd={onAddRecipient} />
          </div>
        )}
      </div>

      {/* Subject */}
      <Field label="subject">
        <input
          value={subject}
          onChange={(e) => onSubjectChange?.(e.target.value)}
          className={cn(
            'w-full h-9 px-3 rounded-md text-[13px]',
            'text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-950',
            'border border-zinc-200 dark:border-zinc-800',
            'focus:outline-none focus:border-red-700 focus:ring-[3px] focus:ring-red-700/15 dark:focus:ring-red-400/20'
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </Field>

      {/* Body */}
      <Field label="message · roboto 14px">
        <textarea
          value={body}
          onChange={(e) => onBodyChange?.(e.target.value)}
          rows={6}
          className={cn(
            'w-full min-h-[140px] px-3 py-2.5 rounded-md text-[14px] leading-relaxed resize-y',
            'text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-950',
            'border border-zinc-200 dark:border-zinc-800',
            'focus:outline-none focus:border-red-700 focus:ring-[3px] focus:ring-red-700/15 dark:focus:ring-red-400/20'
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </Field>

      {/* Attachments */}
      {attachments.length > 0 && (
        <Field label={`attachments · ${attachments.length}`}>
          <div className="grid gap-1.5">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900"
              >
                <div
                  className="w-6 h-6 rounded inline-flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[8px] font-semibold tracking-wider text-red-700 dark:text-red-400"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {(a.kind ?? 'pdf').toUpperCase()}
                </div>
                <span className="flex-1 text-[13px] text-zinc-900 dark:text-zinc-50 truncate">{a.name}</span>
                <span
                  className="text-[10.5px] text-zinc-500 tracking-wide flex-shrink-0"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {a.size}
                </span>
                {onRemoveAttachment && (
                  <button
                    type="button"
                    aria-label={`Remove ${a.name}`}
                    onClick={() => onRemoveAttachment(a.id)}
                    className="w-5 h-5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 inline-flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Field>
      )}

      {/* Quotation-only date toggle */}
      {isQuote && onUpdateDateChange && (
        <label
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer',
            'border border-dashed',
            updateDate
              ? 'border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10'
              : 'border-zinc-200 dark:border-zinc-800'
          )}
        >
          <input
            type="checkbox"
            checked={!!updateDate}
            onChange={(e) => onUpdateDateChange(e.target.checked)}
            className="sr-only peer"
          />
          <span
            className={cn(
              'w-4 h-4 rounded-sm flex-shrink-0 inline-flex items-center justify-center',
              'border-[1.5px]',
              updateDate
                ? 'border-red-700 bg-red-700 text-white'
                : 'border-zinc-400 dark:border-zinc-600 bg-transparent'
            )}
            aria-hidden
          >
            {updateDate && (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M2 5 L4.5 7.5 L8 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50">{updateDateLabel}</div>
            {updateDateDescription && (
              <div
                className="mt-0.5 text-[10.5px] text-zinc-500 tracking-wide"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {updateDateDescription}
              </div>
            )}
          </div>
        </label>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-[10.5px] font-medium uppercase tracking-widest text-zinc-500 mb-1.5"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </div>
  );
}

function RecipientRow({
  field,
  list,
  onRemove,
  onAdd,
}: {
  field: 'to' | 'cc' | 'bcc';
  list: SendEmailRecipient[];
  onRemove?: (field: 'to' | 'cc' | 'bcc', value: string) => void;
  onAdd?: (field: 'to' | 'cc' | 'bcc', raw: string) => void;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div
      className={cn(
        'min-h-9 px-2 py-1 rounded-md flex items-center gap-1.5 flex-wrap',
        'border border-zinc-200 dark:border-zinc-800',
        'bg-white dark:bg-zinc-950',
        'focus-within:border-red-700 focus-within:ring-[3px] focus-within:ring-red-700/15'
      )}
    >
      {field !== 'to' && (
        <span
          className="text-[10.5px] uppercase tracking-widest text-zinc-500 px-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {field}
        </span>
      )}
      {list.map((r) => (
        <span
          key={r.value}
          className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span title={r.sub}>{r.label}</span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(field, r.value)}
              aria-label={`Remove ${r.label}`}
              className="w-4 h-4 rounded-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 inline-flex items-center justify-center"
            >
              <X className="w-2 h-2" />
            </button>
          )}
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim() && onAdd) {
            onAdd(field, draft.trim());
            setDraft('');
          }
        }}
        placeholder={list.length === 0 ? 'Add recipient…' : ''}
        className="flex-1 min-w-[120px] h-6 bg-transparent border-none outline-none text-[13px] text-zinc-900 dark:text-zinc-50"
        style={{ fontFamily: 'var(--font-sans)' }}
      />
    </div>
  );
}
