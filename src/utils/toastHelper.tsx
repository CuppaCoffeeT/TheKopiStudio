import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { AppBaseToast } from '@/components/primitives/overlays/Toaster';
import type { OverlayVariant } from '@/components/primitives/overlays/shared';

export type ToastType = OverlayVariant;

interface ShowToastOpts {
  /** Plain string OR a node (e.g. a bulleted blocker list). Rendered as-is by AppBaseToast. */
  description?: ReactNode;
  /** Duration ms. Default 4000. */
  duration?: number;
  /** Inline primary action button. */
  action?: { label: string; onClick: () => void };
  /** Inline cancel/undo button. */
  cancel?: { label: string; onClick?: () => void };
}

/**
 * Render the AppBase spec-accurate toast. All variants route through the
 * `AppBaseToast` custom component so layout matches Claude Design S2 exactly
 * (18px glyph circle · 13px title · 12px desc · always-visible XClose · border-l-[3px]).
 *
 * Spec: docs/99-refactor/_system/design/session-02-overlays/export/appbase/project/overlays/OverlayPrimitives.jsx
 */
export const showToast = (
  type: ToastType,
  message: string,
  descriptionOrOpts?: string | ShowToastOpts
) => {
  const opts: ShowToastOpts =
    typeof descriptionOrOpts === 'string'
      ? { description: descriptionOrOpts }
      : descriptionOrOpts ?? {};

  toast.custom(
    (id) => (
      <AppBaseToast
        variant={type}
        title={message}
        description={opts.description}
        action={opts.action}
        cancel={opts.cancel}
        onDismiss={() => toast.dismiss(id)}
      />
    ),
    { duration: opts.duration ?? 4000 }
  );
};

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const showEnhancedToast = ({ title, description, variant = 'default' }: ToastOptions) => {
  const type: ToastType = variant === 'destructive' ? 'error' : 'success';
  showToast(type, title ?? '', description);
};

export const showSuccess = (message: string, description?: string) =>
  showToast('success', message, description);

export const showError = (message: string, error?: Error) => {
  if (error) {
    console.error('🚨 Error:', { message, error: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    if (error.message.includes('Maximum call stack size exceeded')) {
      const stackLines = error.stack?.split('\n') || [];
      const relevantLines = stackLines.slice(0, 10);
      showEnhancedToast({
        title: 'Infinite Recursion Detected',
        description: `${message}\n\nStack trace preview:\n${relevantLines.join('\n')}`,
        variant: 'destructive',
      });
      console.error('🔄 INFINITE RECURSION STACK TRACE:', error.stack);
      return;
    }
  }
  showToast('error', message);
};

export const showInfo = (message: string, description?: string) =>
  showToast('info', message, description);
export const showWarning = (message: string, description?: string) =>
  showToast('warning', message, description);
