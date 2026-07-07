/**
 * DialogCompat — compositional shadcn-compat Dialog + AlertDialog primitives.
 *
 * Uses the same visual shell as <Modal> (glass backdrop, pixel-display title,
 * slate-800 primary, red-700 destructive) but exposes the shadcn API
 * (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`,
 * `DialogDescription`, `DialogFooter`, `DialogTrigger`, `DialogClose` +
 * `AlertDialog*` equivalents) so legacy adopters can migrate via import swap.
 *
 * Locked: glass backdrop · title in Geist Pixel Square · focus ring red-700.
 */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { X } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { GLASS_BACKDROP } from './shared';

// ─── Dialog ────────────────────────────────────────────────────────────

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50',
        GLASS_BACKDROP,
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  );
});

export const DialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
    /** Forwarded to the overlay (backdrop). Use for z-index overrides when stacking dialogs. */
    overlayClassName?: string;
  }
>(function DialogContent({ className, children, showClose = true, overlayClassName, ...props }, ref) {
  // Centering uses a grid wrapper instead of `transform: translate(-50%, -50%)` so
  // descendants with `position: fixed` (e.g. non-portaled `SearchableMultiSelect`
  // Popover content per .claude/rules/ui-components.md) position relative to the
  // viewport, not a transformed containing block. Wrapper itself uses `position:
  // fixed` (no transform) so fixed-child positioning + viewport scroll both work.
  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 pointer-events-none">
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'pointer-events-auto relative z-50',
            'w-[min(560px,92vw)]',
            'rounded-xl bg-card',
            'border border-border',
            'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_64px_rgba(24,24,27,0.14)]',
            'dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_64px_rgba(0,0,0,0.5)]',
            'px-5 py-5',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            className,
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
          {...props}
        >
          {children}
          {showClose && (
            <DialogPrimitive.Close
              className="absolute right-3 top-3 w-6 h-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="w-3 h-3" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
});

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 mb-3', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-4 pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
        'border-t border-border',
        className,
      )}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        'text-[22px] leading-tight m-0 font-normal text-foreground',
        className,
      )}
      style={{
        fontFamily: 'var(--font-pixel)',
        letterSpacing: '-0.01em',
        WebkitFontSmoothing: 'none',
      }}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-[12.5px] text-muted-foreground', className)}
      {...props}
    />
  );
});

// ─── AlertDialog ───────────────────────────────────────────────────────

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export const AlertDialogOverlay = forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(function AlertDialogOverlay({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50',
        GLASS_BACKDROP,
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  );
});

export const AlertDialogContent = forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(function AlertDialogContent({ className, ...props }, ref) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 pointer-events-none">
        <AlertDialogPrimitive.Content
          ref={ref}
          className={cn(
            'pointer-events-auto relative z-50',
            'w-[min(460px,92vw)]',
            'rounded-xl bg-card',
            'border border-border',
            'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_64px_rgba(24,24,27,0.14)]',
            'dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_64px_rgba(0,0,0,0.5)]',
            'px-5 py-5',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            className,
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
          {...props}
        />
      </div>
    </AlertDialogPortal>
  );
});

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 mb-3', className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-4 pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
        'border-t border-border',
        className,
      )}
      {...props}
    />
  );
}

export const AlertDialogTitle = forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(function AlertDialogTitle({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn(
        'text-[22px] leading-tight m-0 font-normal text-foreground',
        className,
      )}
      style={{
        fontFamily: 'var(--font-pixel)',
        letterSpacing: '-0.01em',
        WebkitFontSmoothing: 'none',
      }}
      {...props}
    />
  );
});

export const AlertDialogDescription = forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(function AlertDialogDescription({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn('text-[12.5px] text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  );
});

export const AlertDialogAction = forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(function AlertDialogAction({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(
        'h-8 px-3.5 rounded-md text-[13px] font-medium inline-flex items-center justify-center gap-2',
        'bg-primary hover:bg-primary/90 text-primary-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    />
  );
});

export const AlertDialogCancel = forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(function AlertDialogCancel({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        'h-8 px-3 rounded-md text-xs font-medium inline-flex items-center justify-center gap-2',
        'border border-border',
        'text-muted-foreground',
        'hover:bg-secondary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    />
  );
});
