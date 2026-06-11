import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Label — standalone `<label>` element for form controls.
 *
 * Spec: FormPrimitives.html (eyebrow label style shared with Field).
 * Use `<Field>` when you need label + input + error wiring; use `<Label>`
 * when you only need the label text styled (e.g. inside a dialog row
 * with inline layout, or above a custom input composition).
 *
 * Locked: 13px sans · zinc-700 · disabled peer state grays out.
 */

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** When true, renders as an eyebrow (mono 10.5px uppercase), matching Field's label. */
  eyebrow?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { eyebrow = false, className, children, ...props },
  ref,
) {
  if (eyebrow) {
    return (
      <label
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 uppercase',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className,
        )}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.08em',
        }}
        {...props}
      >
        {children}
      </label>
    );
  }

  return (
    <label
      ref={ref}
      className={cn(
        'text-[13px] font-medium text-zinc-700 dark:text-zinc-300',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {children}
    </label>
  );
});
