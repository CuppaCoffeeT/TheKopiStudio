/**
 * DatePicker.panel — CalendarPanel (month grid + Today/Clear footer) for the DatePicker primitive.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MONTHS_FULL,
  MONTHS_SHORT,
  WEEKDAYS,
  sameDay,
  startOfDay,
  type DatePickerMode,
  type DateRange,
} from './DatePicker.helpers';
import { MonoDropdown } from './DatePicker.dropdown';

export interface CalendarPanelProps {
  viewDate: Date;
  setViewDate: (d: Date) => void;
  mode: DatePickerMode;
  value: Date | null;
  rangeValue: DateRange;
  rangeHover: Date | null;
  setRangeHover: (d: Date | null) => void;
  onDayClick: (d: Date) => void;
  onToday: () => void;
  onClear: () => void;
  fromYear: number;
  toYear: number;
  disabledDate?: (d: Date) => boolean;
  todayTestId?: string;
  clearTestId?: string;
}

export function CalendarPanel({
  viewDate, setViewDate, mode, value, rangeValue,
  rangeHover, setRangeHover, onDayClick, onToday, onClear,
  fromYear, toYear, disabledDate, todayTestId, clearTestId,
}: CalendarPanelProps) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: { d: Date; muted: boolean }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ d: new Date(year, month - 1, prevDays - i), muted: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d: new Date(year, month, d), muted: false });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ d: new Date(year, month + 1, trailing++), muted: true });
  }

  const today = startOfDay(new Date());
  const goPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goNext = () => setViewDate(new Date(year, month + 1, 1));
  const years: number[] = [];
  for (let y = fromYear; y <= toYear; y++) years.push(y);

  return (
    <div
      className={cn(
        'w-[296px] rounded-[10px] p-3.5',
        'bg-card',
        'border border-border',
        // Warm-ink float, matching TIME_PICKER_PANEL_CLASS — 2a tints its
        // shadows with the ink (#3A2E24), never black.
        'shadow-[0_12px_40px_rgb(58_46_36_/_0.12)]',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex items-center gap-1 mb-2.5">
        <button
          type="button"
          onClick={goPrev}
          className="w-7 h-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-secondary"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex-1 flex justify-center gap-1.5">
          <MonoDropdown
            label={MONTHS_SHORT[month]}
            name="Month"
            value={month}
            options={MONTHS_FULL.map((m, i) => ({ label: m, value: i }))}
            onChange={(v) => setViewDate(new Date(year, v as number, 1))}
          />
          <MonoDropdown
            label={String(year)}
            name="Year"
            value={year}
            options={years.map((y) => ({ label: String(y), value: y }))}
            onChange={(v) => setViewDate(new Date(v as number, month, 1))}
          />
        </div>
        <button
          type="button"
          onClick={goNext}
          className="w-7 h-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-secondary"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-1 mb-1 text-muted-foreground uppercase"
        style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.08em' }}
      >
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="w-8 h-5 inline-flex items-center justify-center">{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ d, muted }, i) => {
          const isToday = sameDay(d, today);
          let isSelected = false;
          let isRangeStart = false;
          let isRangeEnd = false;
          let isInRange = false;

          if (mode === 'single') {
            isSelected = !muted && sameDay(d, value);
          } else {
            const { start, end } = rangeValue;
            if (start && sameDay(d, start)) isRangeStart = true;
            if (end && sameDay(d, end)) isRangeEnd = true;
            if (start && end && d > start && d < end) isInRange = true;
            if (start && !end && rangeHover) {
              const lo = start < rangeHover ? start : rangeHover;
              const hi = start < rangeHover ? rangeHover : start;
              if (d > lo && d < hi) isInRange = true;
            }
          }

          const isDisabledDay = !muted && !!disabledDate?.(d);
          const isInactive = muted || isDisabledDay;
          return (
            <button
              key={i}
              type="button"
              disabled={isInactive}
              onClick={() => !isInactive && onDayClick(d)}
              onMouseEnter={() => mode === 'range' && !isInactive && setRangeHover(d)}
              onMouseLeave={() => mode === 'range' && setRangeHover(null)}
              className={cn(
                'w-8 h-8 rounded-md inline-flex items-center justify-center border tabular-nums',
                muted && 'text-muted-foreground cursor-not-allowed',
                isDisabledDay && !muted && 'text-muted-foreground cursor-not-allowed line-through',
                !isInactive && 'cursor-pointer',
                !isInactive && !isSelected && !isRangeStart && !isRangeEnd && !isInRange && 'text-muted-foreground hover:bg-secondary',
                isInRange && 'bg-primary/10 text-[color:var(--brown-text)]',
                (isSelected || isRangeStart || isRangeEnd) && 'bg-primary text-primary-foreground font-semibold',
                isToday && !isSelected && !isRangeStart && !isRangeEnd
                  ? 'border-primary font-semibold'
                  : 'border-transparent',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border">
        <button
          type="button"
          onClick={onToday}
          data-testid={todayTestId}
          className="h-[26px] px-2.5 rounded-md border border-border text-[color:var(--brown-text)] hover:bg-secondary"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          Today
        </button>
        <button
          type="button"
          onClick={onClear}
          data-testid={clearTestId}
          className="h-[26px] px-2.5 rounded-md border border-border text-muted-foreground hover:bg-secondary"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
