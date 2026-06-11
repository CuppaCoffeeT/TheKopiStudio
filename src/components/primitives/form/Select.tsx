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
 * Locked: focus ring red-700 never silent; chevron rotates via [data-open=true].
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
        error
          ? 'border-red-700 dark:border-red-400'
          : 'border-zinc-300 dark:border-zinc-700',
        !disabled && !error && 'hover:border-zinc-400 dark:hover:border-zinc-600',
        !error &&
          'focus-within:border-red-700 dark:focus-within:border-red-400 focus-within:ring-[3px] focus-within:ring-red-700/15 dark:focus-within:ring-red-400/25',
        error &&
          'focus-within:ring-[3px] focus-within:ring-red-700/15 dark:focus-within:ring-red-400/25',
        disabled ? 'bg-zinc-100 dark:bg-zinc-900 opacity-80 cursor-not-allowed' : 'bg-white dark:bg-zinc-950',
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
          isEmpty ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-900 dark:text-zinc-50',
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
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 dark:text-zinc-400"
        size={14}
      />
    </div>
  );
});
