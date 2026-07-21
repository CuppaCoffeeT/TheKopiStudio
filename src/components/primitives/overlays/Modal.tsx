import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GLASS_BACKDROP } from './shared';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'wide' | 'full';
/**
 * `wide` (1024px) and `full` (1152px) added 2026-05-23 for multi-panel dialogs
 * (e.g. drafter dashboard's BulkCompleteDrawingsDialog). The `tall` prop pairs
 * with these to opt the inner shell into `h-[80vh] flex flex-col` so callers
 * can scroll inside.
 */
const SIZE_PX: Record<ModalSize, number> = {
  sm: 340,
  md: 460,
  lg: 520,
  xl: 560,
  xxl: 800,
  wide: 1024,
  full: 1152,
};

interface ModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  destructive?: boolean;
  size?: ModalSize;
  /** Fix the inner shell to `80vh` and switch to a column flex so callers can scroll inside the body. */
  tall?: boolean;
  /** Replace the default `px-5 py-4 grid gap-3` body classes (e.g. `'p-0 flex-1 overflow-hidden'` for full-bleed panels). */
  bodyClassName?: string;
  /** Forwarded to Radix DialogContent — guard a submit-in-progress flow against accidental close. */
  onInteractOutside?: (event: Event) => void;
  /** Forwarded to Radix DialogContent — same purpose for ESC. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Testid forwarded to DialogContent (the visible Modal surface). */
  testId?: string;
}

/**
 * Modal — wraps shadcn Dialog with glass backdrop + slate-800 header + destructive variant.
 * The title renders in Geist Pixel Square crisp (per W08 h1 rule).
 * Pass action row via `footer` (usually slate-800 primary + ghost cancel).
 *
 * `size='wide' | 'full'` + `tall` + `bodyClassName` enable multi-panel layouts
 * like the drafter dashboard's bulk NAS-file linker.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  destructive = false,
  size = 'md',
  tall = false,
  bodyClassName,
  onInteractOutside,
  onEscapeKeyDown,
  children,
  footer,
  testId,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50',
            GLASS_BACKDROP,
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0'
          )}
        />
        {/*
         * DialogContent is a viewport-filling flex centerer with NO transform — that
         * way `position: fixed` children (e.g. SearchableMultiSelect's non-portaled
         * Popover) position to the viewport, not the modal frame. The inner div is
         * the actual visible modal box; `group-data-[state=...]` propagates Radix's
         * open/closed state from DialogContent down so animations still fire.
         */}
        <DialogPrimitive.Content
          data-testid={testId}
          onInteractOutside={onInteractOutside}
          onEscapeKeyDown={(e) => {
            onEscapeKeyDown?.(e);
            if (!e.defaultPrevented) onOpenChange(false);
          }}
          className="group fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
        <div
          className={cn(
            'pointer-events-auto rounded-xl',
            // 1a: modal surface is one step lighter than card — #182638 (--popover)
            'bg-popover',
            'border border-border',
            'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_64px_rgba(24,24,27,0.14)]',
            'dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_64px_rgba(0,0,0,0.5)]',
            'group-data-[state=open]:animate-in group-data-[state=closed]:animate-out',
            'group-data-[state=open]:zoom-in-95 group-data-[state=closed]:zoom-out-95',
            'group-data-[state=open]:fade-in-0 group-data-[state=closed]:fade-out-0',
            tall && 'flex flex-col h-[80dvh] max-h-[80dvh]',
            'max-w-[calc(100vw-2rem)]',
            'max-h-[calc(100dvh-2rem)]'
          )}
          style={{ width: SIZE_PX[size], fontFamily: 'var(--font-sans)' }}
        >
          {/* Header */}
          <div className="px-5 pt-4.5 pb-3.5 flex items-start justify-between gap-3 border-b border-border">
            <div className="flex-1 min-w-0">
              <DialogPrimitive.Title
                className={cn(
                  'text-[22px] leading-tight m-0 font-normal',
                  destructive ? 'text-red-700 dark:text-red-400' : 'text-foreground'
                )}
                style={{
                  fontFamily: 'var(--font-pixel)',
                  letterSpacing: '-0.01em',
                  WebkitFontSmoothing: 'none',
                }}
              >
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-[11.5px] text-muted-foreground mt-1">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className={cn(bodyClassName ?? 'px-5 py-4 grid gap-3')}>{children}</div>

          {/* Footer */}
          {footer && (
            <div
              className={cn(
                'px-5 pb-4 pt-3 flex justify-end gap-2 rounded-b-xl',
                'border-t border-border',
                'bg-secondary'
              )}
            >
              {footer}
            </div>
          )}
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Convenience primary action for use in Modal `footer`. Slate-800 / red-700 when destructive. */
export function ModalPrimaryAction({
  children,
  destructive = false,
  onClick,
  disabled = false,
  'data-testid': dataTestId,
}: {
  children: React.ReactNode;
  destructive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  'data-testid'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      className={cn(
        'h-8 px-3.5 rounded-lg text-[12.5px] font-semibold',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-2 focus-visible:outline-[color:var(--cta-primary-bg)] focus-visible:outline-offset-2',
        destructive
          ? 'bg-red-700 hover:bg-red-800 active:bg-red-900 text-white'
          : 'bg-[var(--cta-primary-bg)] hover:bg-[var(--cta-primary-bg-hover)] active:bg-[var(--cta-primary-bg-active)] text-[color:var(--cta-primary-fg)]'
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {children}
    </button>
  );
}

export function ModalGhostAction({
  children,
  onClick,
  disabled = false,
  'data-testid': dataTestId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  'data-testid'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-[color:var(--fg-dim)] hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[color:var(--cta-primary-bg)] focus-visible:outline-offset-2"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {children}
    </button>
  );
}
