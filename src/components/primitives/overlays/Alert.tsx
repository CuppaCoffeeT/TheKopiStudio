import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VARIANT_ACCENT, VARIANT_ICON, type OverlayVariant } from './shared';

interface AlertProps {
  variant?: OverlayVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  dismissAction?: { label: string; onClick: () => void };
  onClose?: () => void;
  className?: string;
}

/**
 * In-page banner alert. Variant-accented border-left. Not a toast — stays in DOM flow.
 * For transient feedback use `toast()` from sonner.
 */
export function Alert({
  variant = 'info',
  title,
  description,
  primaryAction,
  dismissAction,
  onClose,
  className,
}: AlertProps) {
  const accent = VARIANT_ACCENT[variant];

  return (
    <div
      role="alert"
      className={cn(
        'w-full rounded-lg border',
        'bg-card/[0.88]',
        'border-border',
        'px-4 py-3.5 flex items-start gap-3.5',
        className
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: `var(--alert-accent-${variant}, ${accent.light})`, fontFamily: 'var(--font-sans)' }}
    >
      <VariantIcon variant={variant} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-foreground">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </div>
        )}
        {(primaryAction || dismissAction) && (
          <div className="mt-2.5 flex gap-2">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className={cn(
                  'h-7 px-2.5 rounded text-xs font-medium',
                  variant === 'error'
                    ? 'bg-red-700 hover:bg-red-800 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                )}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {primaryAction.label}
              </button>
            )}
            {dismissAction && (
              <button
                onClick={dismissAction.onClick}
                className="h-7 px-2.5 rounded text-xs border border-border text-muted-foreground hover:bg-secondary"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {dismissAction.label}
              </button>
            )}
          </div>
        )}
      </div>
      {onClose && (
        <button
          aria-label="Dismiss"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function VariantIcon({ variant }: { variant: OverlayVariant }) {
  const accent = VARIANT_ACCENT[variant];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white text-[11px] font-semibold leading-none flex-shrink-0"
      style={{
        width: 18,
        height: 18,
        background: `var(--alert-accent-${variant}, ${accent.light})`,
        fontFamily: 'var(--font-sans)',
      }}
      aria-hidden
    >
      {VARIANT_ICON[variant]}
    </span>
  );
}
