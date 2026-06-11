/**
 * DatePicker.trigger — trigger for the DatePicker primitive.
 *
 * Two shapes:
 *   - default (range mode) → display-only `<button>` that opens the calendar.
 *   - `editable` (single mode) → typeable `<input>` (dd/mm/yyyy) + clickable
 *     calendar icon. Users can type numbers OR click to pick. Typing is
 *     parsed/committed by the parent on blur/Enter (see DatePicker.tsx).
 */
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DatePickerSize } from './DatePicker.helpers';

interface DatePickerTriggerProps {
  open: boolean;
  displayText: string;
  placeholder: string;
  disabled: boolean;
  error: boolean;
  size: DatePickerSize;
  triggerTestId?: string;
  onClick: () => void;
  /** Single mode → render a typeable input instead of a display-only button. */
  editable?: boolean;
  /** Value shown in the editable input (typed text while focused, else display). */
  inputValue?: string;
  onInputChange?: (s: string) => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function DatePickerTrigger({
  open, displayText, placeholder, disabled, error, size, triggerTestId, onClick,
  editable, inputValue, onInputChange, onInputFocus, onInputBlur, onInputKeyDown,
}: DatePickerTriggerProps) {
  const heightCls =
    size === 'lg' ? 'h-12 text-[14px]' : size === 'sm' ? 'h-7 text-xs' : 'h-10 text-[13px]';
  const padCls = size === 'sm' ? 'px-2' : 'px-3';
  // Touch keyboard zoom guard on the larger sizes (dense sm stays compact for desktop tables).
  const touchTextCls = size === 'sm' ? '' : 'pointer-coarse:text-[16px]';

  const frameCls = cn(
    'w-full flex items-center gap-2 rounded-lg border tabular-nums',
    padCls,
    heightCls,
    error ? 'border-red-700 dark:border-red-400' : 'border-zinc-300 dark:border-zinc-700',
    !disabled && !error && 'hover:border-zinc-400 dark:hover:border-zinc-600',
    open && !error && 'border-red-700 dark:border-red-400 ring-[3px] ring-red-700/15 dark:ring-red-400/25',
    disabled ? 'bg-zinc-100 dark:bg-zinc-900 opacity-80 cursor-not-allowed' : 'bg-white dark:bg-zinc-950',
    'transition-[box-shadow,border-color] duration-150',
  );

  if (editable) {
    return (
      <div className={cn(frameCls, !disabled && 'cursor-text')}>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={onClick}
          aria-label="Open calendar"
          className={cn('flex-shrink-0 inline-flex items-center', !disabled && 'cursor-pointer')}
        >
          <Calendar size={14} className="text-zinc-500 dark:text-zinc-400" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={inputValue ?? ''}
          placeholder={placeholder}
          data-testid={triggerTestId}
          onChange={(e) => onInputChange?.(e.target.value)}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          onKeyDown={onInputKeyDown}
          className={cn(
            'flex-1 min-w-0 bg-transparent border-0 p-0 outline-none',
            touchTextCls,
            'text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-600 dark:placeholder:text-zinc-300',
            disabled && 'cursor-not-allowed',
            'focus:outline-none focus-visible:outline-none',
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={triggerTestId}
      className={cn(
        frameCls,
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {!displayText && (
        <Calendar size={14} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
      )}
      <span
        className={cn(
          'flex-1 text-left truncate',
          displayText ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-300',
        )}
      >
        {displayText || placeholder}
      </span>
    </button>
  );
}
