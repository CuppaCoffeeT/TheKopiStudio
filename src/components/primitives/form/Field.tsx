import { cn } from '@/lib/utils';

/**
 * Field — form shell: label eyebrow + input slot + helper/error text + required(*).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: label uses mono-font 10.5px uppercase; required(*) red-700; error text shows circle-info icon.
 */

interface FieldProps {
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, required, hint, error, className, children }: FieldProps) {
  // Keep <div> wrapper — earlier <label> experiment broke click delegation
  // for Fields whose children include non-input widgets (DatePicker buttons,
  // SearchableMultiSelect, etc.). Form labels still get associated to inputs
  // via the per-input aria-label/aria-labelledby props that callers pass.
  const Wrapper = 'div';
  return (
    <Wrapper className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span
          className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 uppercase"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.08em',
          }}
        >
          <span>{label}</span>
          {required && (
            <>
              {' '}
              <span className="text-red-700 dark:text-red-400 font-semibold">*</span>
            </>
          )}
        </span>
      )}
      {children}
      {(error || hint) && (
        <span
          className={cn(
            'flex items-center gap-1 leading-[1.4]',
            error
              ? 'text-red-700 dark:text-red-400'
              : 'text-zinc-500 dark:text-zinc-400'
          )}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 12 }}
        >
          {error && (
            <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path
                d="M6 3.5 V6.5 M6 8 V8.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          )}
          <span>{error || hint}</span>
        </span>
      )}
    </Wrapper>
  );
}
