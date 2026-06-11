/**
 * TimePicker.trigger — clock-icon trigger button for the TimePicker primitive.
 */
import { forwardRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimePickerSize } from './TimePicker.helpers';

export interface TimePickerTriggerProps {
  open: boolean;
  display: string;
  placeholder: string;
  disabled: boolean;
  error: boolean;
  size: TimePickerSize;
  ariaLabel: string;
  triggerTestId?: string;
  onClick: () => void;
}

export const TimePickerTrigger = forwardRef<HTMLButtonElement, TimePickerTriggerProps>(
  function TimePickerTrigger(
    { open, display, placeholder, disabled, error, size, ariaLabel, triggerTestId, onClick },
    ref,
  ) {
    const heightClass = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-8' : 'h-10';
    const textSizeClass = size === 'lg' ? 'text-sm' : 'text-[13px]';
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={onClick}
        data-testid={triggerTestId}
        style={{ fontFamily: 'var(--font-mono)' }}
        className={cn(
          'w-full flex items-center gap-2 px-3 rounded-lg border bg-white dark:bg-zinc-950',
          heightClass,
          textSizeClass,
          'tabular-nums text-left appearance-none transition-[box-shadow,border-color,background] duration-150',
          error || open ? 'border-red-700 dark:border-red-400' : 'border-zinc-200 dark:border-zinc-800',
          open && 'ring-[3px] ring-red-700/15 dark:ring-red-400/25',
          'hover:border-zinc-400 dark:hover:border-zinc-600',
          'active:bg-zinc-50 dark:active:bg-zinc-900',
          'focus-visible:outline-none focus-visible:border-red-700 dark:focus-visible:border-red-400 focus-visible:ring-[3px] focus-visible:ring-red-700/15 dark:focus-visible:ring-red-400/25',
          'disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-80',
          display ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500',
        )}
      >
        <Clock className={cn(size === 'lg' ? 'h-4 w-4' : size === 'sm' ? 'h-3 w-3' : 'h-[14px] w-[14px]', 'shrink-0 text-zinc-500 dark:text-zinc-400')} />
        <span className="flex-1 truncate text-center tracking-[0.04em]">{display || placeholder}</span>
        <span aria-hidden className={cn(size === 'lg' ? 'w-4' : size === 'sm' ? 'w-3' : 'w-[14px]', 'shrink-0')} />
      </button>
    );
  },
);
