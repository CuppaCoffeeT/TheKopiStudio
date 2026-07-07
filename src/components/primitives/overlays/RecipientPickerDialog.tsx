import { type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, Plus, Mail, Building2, User, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GLASS_BACKDROP } from './shared';

/**
 * RecipientPickerDialog — visual shell for the email recipient picker shared by
 * Quotation + Invoice send-email flows. Caller wires queries, mutations, and
 * the 3 sub-modals (ContactForm · CompanyEmailModal · AdhocContactDialog).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-27-EWSiu3Vc/project/ui_kits/appbase/src/RecipientPickerDialog.jsx
 * Preview: docs/99-refactor/_system/design/handoffs/2026-04-27-EWSiu3Vc/project/preview/component-recipient-picker-dialog.html
 *
 * Locked:
 *   • 560px width · max-h 80vh · glass scrim · slate-800 primary CTA
 *   • Header = Geist Pixel h2 lowercase + 12px description
 *   • Search + to/cc segmented row · scrollable list body · footer with selected-count + Add CTA
 *   • Row tones: blue (Client Contact) · green (Company Email) · orange (Other Company / Unlinked)
 *   • Cross-company rows tint orange-50 on hover; selected row gets red-700 inset rail + checkmark fill
 */

interface RecipientPickerDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Action chips above the search input (Add Contact / Add Company Email / Add Custom Email). */
  actions?: ReactNode;
  searchValue: string;
  onSearchChange: (next: string) => void;
  searchPlaceholder?: string;
  recipientType: 'to' | 'cc';
  onRecipientTypeChange: (next: 'to' | 'cc') => void;
  /** Body slot — rows OR loading/empty/no-results state component. */
  children: ReactNode;
  selectedCount: number;
  onCancel: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  /**
   * When true, blocks outside-click / pointer-down-outside / escape from
   * dismissing the dialog. Used by the EmailRecipientPicker composition so
   * sub-modals (ContactForm / CompanyEmailModal / AdhocContactDialog) can
   * layer over the picker without collapsing it on stray clicks.
   * Added 2026-05-28 (Phase E /quotations W09 closeout).
   */
  suppressDismiss?: boolean;
}

export function RecipientPickerDialog({
  open,
  onOpenChange,
  title = 'Add recipients',
  description = 'Pick from contacts, company emails, or add a custom address.',
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search by name, email, or company…',
  recipientType,
  onRecipientTypeChange,
  children,
  selectedCount,
  onCancel,
  onSubmit,
  submitDisabled,
  suppressDismiss = false,
}: RecipientPickerDialogProps) {
  const submitBlocked = submitDisabled ?? selectedCount === 0;
  const guard = (e: { preventDefault: () => void }) => { if (suppressDismiss) e.preventDefault(); };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next && suppressDismiss) return; onOpenChange(next); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50',
            GLASS_BACKDROP,
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />
        <DialogPrimitive.Content
          onInteractOutside={guard}
          onPointerDownOutside={guard}
          onEscapeKeyDown={guard}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'flex w-[560px] max-w-[calc(100vw-32px)] max-h-[80vh] flex-col overflow-hidden rounded-xl',
            'border border-border bg-card',
            'shadow-[0_24px_64px_rgba(24,24,27,0.14)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.5)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-[22px] pb-3.5 pt-4.5">
            <div className="flex-1 min-w-0">
              <DialogPrimitive.Title
                className="m-0 text-[22px] font-normal leading-[1.1] text-foreground"
                style={{
                  fontFamily: 'var(--font-pixel)',
                  letterSpacing: '-0.01em',
                  WebkitFontSmoothing: 'none',
                  textTransform: 'lowercase',
                }}
              >
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-[12px] text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </DialogPrimitive.Close>
          </div>

          {actions && <div className="flex flex-wrap gap-2 px-[22px] pt-3">{actions}</div>}

          <div className="flex items-center gap-2.5 px-[22px] py-3">
            <div className="flex h-[34px] flex-1 items-center gap-2 rounded-md border border-border bg-card px-2.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-[12.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            <RecipientTypeToggle value={recipientType} onChange={onRecipientTypeChange} />
          </div>

          <div className="flex-1 min-h-[240px] max-h-[380px] overflow-y-auto bg-card">
            {children}
          </div>

          <div className="flex items-center gap-2.5 border-t border-border bg-secondary px-[22px] pb-4 pt-3">
            <span className="font-mono text-[12px] text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected` : 'No recipients selected'}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={onCancel}
              className="h-8 cursor-pointer rounded-md border-none bg-transparent px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitBlocked}
              className={cn(
                'h-8 rounded-md border-none px-3.5 text-[12.5px] font-medium transition-colors',
                submitBlocked
                  ? 'cursor-not-allowed bg-muted text-muted-foreground'
                  : 'cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              Add {selectedCount > 0 ? `(${selectedCount}) ` : ''}Recipient{selectedCount === 1 ? '' : 's'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function RecipientTypeToggle({
  value,
  onChange,
}: {
  value: 'to' | 'cc';
  onChange: (next: 'to' | 'cc') => void;
}) {
  return (
    <div className="flex items-center gap-0 rounded-md border border-border bg-secondary p-0.5">
      {(['to', 'cc'] as const).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'cursor-pointer rounded px-3 py-1 text-[12px] font-medium uppercase tracking-[0.06em] transition-colors',
              active
                ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--tw-shadow-color)] shadow-border'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Outline action button used above the search input. */
export function RecipientActionButton({
  icon,
  onClick,
  disabled,
  children,
}: {
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-[12px] font-medium text-muted-foreground transition-colors',
        'hover:bg-secondary hover:border-border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {icon ?? <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
      {children}
    </button>
  );
}

export type RecipientRowTone = 'blue' | 'green' | 'orange';

interface RecipientRowProps {
  selected: boolean;
  onToggle: () => void;
  icon?: 'person' | 'building';
  name: ReactNode;
  email: ReactNode;
  subtitle?: ReactNode;
  badges?: { label: ReactNode; tone: RecipientRowTone }[];
  /** Marks the row as cross-company (orange-50 hover, orange ring on hover). */
  crossCompany?: boolean;
}

const ROW_BADGE_TONE: Record<RecipientRowTone, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40',
  green:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40',
  orange:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-amber-300 dark:border-amber-900/40',
};

export function RecipientRow({
  selected,
  onToggle,
  icon = 'person',
  name,
  email,
  subtitle,
  badges = [],
  crossCompany = false,
}: RecipientRowProps) {
  const Icon = icon === 'building' ? Building2 : User;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'group flex min-h-[52px] cursor-pointer items-center gap-2.5 border-b border-border px-3.5 py-2.5 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        crossCompany
          ? 'hover:bg-orange-50 hover:shadow-[inset_0_0_0_1px_rgb(254_215_170)] dark:hover:bg-orange-950/20 dark:hover:shadow-[inset_0_0_0_1px_rgba(217,119,6,0.30)]'
          : 'hover:bg-secondary',
        selected && 'bg-secondary shadow-[inset_2px_0_0_var(--tw-shadow-color)] shadow-primary',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-[3px] border-[1.5px] transition-colors',
          selected
            ? 'border-primary bg-primary'
            : 'border-border bg-transparent',
        )}
      >
        {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />}
      </span>

      <span
        aria-hidden
        className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-[13px] font-medium text-foreground">
            {name}
          </span>
          <span className="truncate font-mono text-[11.5px] text-muted-foreground">
            {email}
          </span>
        </div>
        {subtitle && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-shrink-0 gap-1.5">
          {badges.map((b, i) => (
            <span
              key={i}
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium leading-[1.4] whitespace-nowrap',
                ROW_BADGE_TONE[b.tone],
              )}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Body-slot empty state. */
export function RecipientPickerEmpty({
  title = 'No contacts yet',
  description = 'Use one of the actions above to add a contact, company email, or custom address.',
}: {
  title?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground">
        <Mail className="h-4.5 w-4.5" />
      </div>
      <div className="text-[13px] font-medium text-foreground">{title}</div>
      <p className="mt-1 text-[12px] leading-[1.5] text-muted-foreground">{description}</p>
    </div>
  );
}

/** Body-slot loading skeleton (5 rows). */
export function RecipientPickerLoading() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex min-h-[52px] items-center gap-2.5 border-b border-border px-3.5 py-2.5"
        >
          <span className="h-3.5 w-3.5 rounded-[3px] bg-secondary" />
          <span className="h-7 w-7 rounded-md bg-secondary" />
          <div className="flex-1 grid gap-1">
            <span className="h-2.5 rounded-[3px] bg-secondary" style={{ width: `${60 - i * 5}%` }} />
            <span className="h-2 rounded-[3px] bg-secondary" style={{ width: `${40 - i * 4}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Body-slot no-results state. */
export function RecipientPickerNoResults({ query }: { query?: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="text-[13px] font-medium text-foreground">
        No matches for &ldquo;{query || 'your search'}&rdquo;
      </div>
      <p className="mt-1 text-[12px] leading-[1.5] text-muted-foreground">
        Try a shorter query, or use{' '}
        <strong className="text-foreground">Add Custom Email</strong> for a one-off
        address.
      </p>
    </div>
  );
}
