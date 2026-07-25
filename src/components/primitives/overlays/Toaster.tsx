/* eslint-disable react-refresh/only-export-components -- re-exports sonner's `toast` alongside the Toaster primitive; HMR-only, no component boundary impact */
import { Toaster as Sonner, toast } from 'sonner';
import { useTheme } from '@/lib/design/ThemeProvider';
import { cn } from '@/lib/utils';
import { VARIANT_ACCENT, VARIANT_ICON, type OverlayVariant } from './shared';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * AppBase Toaster — mounts Sonner with zero default styling (`unstyled`).
 * All toasts render via `toast.custom()` through the helpers in
 * `@/utils/toastHelper` so we control the full layout per Claude Design spec.
 *
 * Spec: docs/99-refactor/_system/design/session-02-overlays/export/appbase/project/overlays/OverlayPrimitives.jsx
 *   - 360px wide · rounded-[10px] · bg-popover/95 cream glass
 *   - backdrop-blur(12px) saturate(140%)
 *   - border-l-[3px] variant accent (2a semantic set — see VARIANT_ACCENT)
 *   - 18px accent circle icon with a cream glyph (✓/!/i/!)
 *   - 13px title · 12px description · always-visible 24px XClose
 */
export function Toaster(props: ToasterProps) {
  const { resolved } = useTheme();

  return (
    <Sonner
      theme={resolved as ToasterProps['theme']}
      position="bottom-right"
      className="toaster"
      toastOptions={{ unstyled: true, duration: 3000 }}
      {...props}
    />
  );
}

interface AppBaseToastProps {
  variant: OverlayVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  cancel?: { label: string; onClick?: () => void };
  onDismiss: () => void;
}

/**
 * Spec-accurate toast body. Render via `toast.custom((id) => <AppBaseToast ... onDismiss={() => toast.dismiss(id)} />)`.
 */
export function AppBaseToast({ variant, title, description, action, cancel, onDismiss }: AppBaseToastProps) {
  const accent = VARIANT_ACCENT[variant];
  return (
    <div
      role="status"
      data-testid={`toast-${variant}`}
      className={cn(
        'w-[360px] rounded-[10px] p-[12px_14px]',
        'flex gap-3 items-start',
        'backdrop-blur-[16px] backdrop-saturate-[160%]',
        'bg-popover/95',
        'border border-border',
        // Warm-ink float shadow — the app is light-pinned, so there is no
        // `dark:` counterpart to declare.
        'shadow-[var(--floating-shadow)]'
      )}
      style={{
        fontFamily: 'var(--font-sans)',
        borderLeftWidth: 3,
        borderLeftColor: accent.light,
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full text-[color:var(--cta-primary-fg)] flex-shrink-0"
        style={{
          width: 18,
          height: 18,
          background: accent.light,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
        }}
        aria-hidden
      >
        {VARIANT_ICON[variant]}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-medium text-foreground"
          style={{ lineHeight: 1.35 }}
        >
          {title}
        </div>
        {description && (
          <div
            className="text-[12px] text-muted-foreground mt-0.5 whitespace-pre-line"
            style={{ lineHeight: 1.5 }}
          >
            {description}
          </div>
        )}
        {(action || cancel) && (
          <div className="mt-2 flex gap-2">
            {action && (
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onDismiss();
                }}
                className="h-6 px-2 rounded text-[11px] font-medium bg-primary text-primary-foreground hover:bg-[var(--cta-primary-bg-hover)]"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {action.label}
              </button>
            )}
            {cancel && (
              <button
                type="button"
                onClick={() => {
                  cancel.onClick?.();
                  onDismiss();
                }}
                className="h-6 px-2 rounded text-[11px] text-muted-foreground bg-transparent hover:text-foreground"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {cancel.label}
              </button>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export { toast };
