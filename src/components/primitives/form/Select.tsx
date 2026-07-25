import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Select — native-feel select trigger with chevron.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked (2a): focus outline is a solid 2px brown (--cta-primary-bg) and never silent; error
 * uses the terracotta --destructive border with a solid --negative-text focus outline;
 * chevron rotates via [data-open=true].
 */

export type SelectSize = 'md' | 'lg';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  error?: boolean;
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    size = 'md',
    error = false,
    placeholder,
    className,
    containerClassName,
    disabled,
    children,
    value,
    defaultValue,
    ...props
  },
  ref
) {
  const heightCls = size === 'lg'
    ? 'h-12 text-[15px] pointer-coarse:text-[16px]'
    : 'h-10 text-[14px] pointer-coarse:text-[16px]';
  const isEmpty = value === undefined || value === '' || value === null;

  return (
    <div
      className={cn(
        'relative w-full flex items-center rounded-lg border transition-[box-shadow,border-color] duration-150',
        heightCls,
        error ? 'border-destructive' : 'border-border',
        !disabled && !error && 'hover:border-border',
        !error &&
          'focus-within:border-ring focus-within:outline-2 focus-within:outline-[color:var(--cta-primary-bg)] focus-within:outline-offset-1',
        error &&
          'focus-within:outline-2 focus-within:outline-[color:var(--negative-text)] focus-within:outline-offset-1',
        disabled ? 'bg-secondary opacity-80 cursor-not-allowed' : 'bg-card',
        containerClassName
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <select
        ref={ref}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        className={cn(
          'appearance-none w-full h-full pl-3 pr-9 bg-transparent outline-none',
          isEmpty ? 'text-muted-foreground' : 'text-foreground',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          className
        )}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
        size={14}
      />
    </div>
  );
});
