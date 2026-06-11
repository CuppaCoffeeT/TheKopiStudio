/**
 * DatePicker — single + range, SG locale (Sun-first, dd MMM yyyy), month/year dropdowns, Today/Clear.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 *
 * Single mode is TYPEABLE (added 2026-05-29): the trigger is an `<input>` that accepts
 * dd/mm/yyyy (also `- .` separators or bare digits) AND a clickable calendar icon. Typed
 * text commits on blur / Enter (Escape reverts); invalid input reverts to the formatted value.
 * Range mode keeps the display-only button trigger.
 *
 * `format` prop: `short` (DEFAULT 2026-05-29) → display "dd/mm/yy"; `long` → "dd MMM yyyy".
 * Placeholder + focus-seed follow suit. Default is short app-wide so every date picker reads
 * the same; pass `format="long"` only where a spelled-out month is explicitly wanted.
 *
 * Locked: focus ring red-700 never silent; selected day = slate-800; today = red-700 ring; Sun-first week;
 *         default display format dd/mm/yy; range uses faint red fill between endpoints.
 *
 * Positioning: OUTSIDE a Radix Dialog the panel auto-portals to body (escapes
 * `overflow:hidden|auto` ancestors — Card wrappers, scrolling tables). INSIDE a Dialog it
 * stays INLINE, because a body-portaled panel inherits Radix's modal `pointer-events:none`
 * body lock (day cells become unclickable) and `react-remove-scroll` blocks iOS taps. To stop
 * the inline panel being clipped by the Dialog's `overflow-y-auto`, it opens RIGHT-aligned when
 * a left-anchored 296px panel would overflow the Dialog's right edge (the /quotations
 * Create-Quotation case). Pass `position` to override the auto-detect.
 */

import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  formatDisplay,
  formatSlashed,
  parseTypedDate,
  sameDay,
  startOfDay,
  type DatePickerFormat,
  type DatePickerMode,
  type DatePickerSize,
  type DateRange,
} from './DatePicker.helpers';
import { CalendarPanel } from './DatePicker.panel';
import { DatePickerTrigger } from './DatePicker.trigger';
import { useDatePickerOutsideClick, useDatePickerPortalPos } from './DatePicker.hooks';

export type { DatePickerMode, DatePickerSize, DateRange } from './DatePicker.helpers';

const PANEL_W = 296; // CalendarPanel width (see DatePicker.panel.tsx `w-[296px]`)

/** A left-anchored panel would spill past the dialog's right edge → open it right-anchored instead. */
function overflowsDialogRight(root: HTMLElement, dialog: HTMLElement): boolean {
  return root.getBoundingClientRect().left + PANEL_W > dialog.getBoundingClientRect().right - 8;
}

interface DatePickerProps {
  mode?: DatePickerMode;
  size?: DatePickerSize;
  value?: Date | null;
  rangeValue?: DateRange;
  onChange?: (d: Date | null) => void;
  onRangeChange?: (r: DateRange) => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** `long` → "dd MMM yyyy" (default). `short` → "dd/mm/yy" (compact numeric display + placeholder). */
  format?: DatePickerFormat;
  className?: string;
  fromYear?: number;
  toYear?: number;
  /** Per-day disabled callback (e.g. `d => d < new Date()`). Added 2026-04-27. */
  disabledDate?: (d: Date) => boolean;
  triggerTestId?: string;
  todayTestId?: string;
  clearTestId?: string;
  /**
   * `portal` renders via Portal (`position: fixed`) so the calendar escapes
   * `overflow: hidden|auto` ancestors. `inline` stays inside the trigger's parent.
   * Auto-detected on open: `inline` inside a `[role="dialog"]` ancestor (a body-portaled
   * panel would be unclickable under the modal's `pointer-events:none` lock + break iOS
   * taps), `portal` everywhere else. Set explicitly to override.
   */
  position?: 'portal' | 'inline';
}

export function DatePicker({
  mode = 'single',
  size = 'md',
  value,
  rangeValue,
  onChange,
  onRangeChange,
  error = false,
  disabled = false,
  placeholder,
  format = 'short',
  className,
  fromYear = 2020,
  toYear = 2030,
  disabledDate,
  triggerTestId,
  todayTestId,
  clearTestId,
  position,
}: DatePickerProps) {
  // Inside a Radix Dialog we render inline (a body-portaled panel inherits the modal's
  // `pointer-events:none` lock + breaks iOS taps); `alignRight` keeps that inline panel from
  // being clipped by the Dialog's overflow. Outside a Dialog we portal (escapes overflow).
  const [insideDialog, setInsideDialog] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const portalled_ = position ? position === 'portal' : !insideDialog;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value || rangeValue?.start || new Date());
  const [rangeHover, setRangeHover] = useState<Date | null>(null);
  // Typed-input buffer (single mode). null = not editing → show formatted value.
  const [typed, setTyped] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState<{ top: number; left: number } | null>(null);

  useDatePickerOutsideClick(open, rootRef, panelRef, () => setOpen(false));
  useDatePickerPortalPos(open, portalled_, rootRef, setPortalPos);

  const short = format === 'short';
  const displayText = useMemo(() => {
    if (mode === 'range') {
      if (rangeValue?.start && rangeValue?.end) {
        return `${formatDisplay(rangeValue.start, format)} – ${formatDisplay(rangeValue.end, format)}`;
      }
      if (rangeValue?.start) return `${formatDisplay(rangeValue.start, format)} – …`;
      return '';
    }
    return formatDisplay(value ?? null, format);
  }, [mode, value, rangeValue, format]);

  const editable = mode === 'single';
  const ph =
    placeholder ?? (mode === 'range' ? 'Start – end' : short ? 'dd/mm/yy' : 'dd/mm/yyyy');

  const openCalendar = () => {
    if (disabled) return;
    if (rootRef.current) {
      setInsideDialog(rootRef.current.closest('[role="dialog"]') !== null);
    }
    setOpen(true);
  };

  const handleInputFocus = () => {
    setTyped(formatSlashed(value, short));
    openCalendar();
  };

  const handleInputChange = (s: string) => {
    setTyped(s);
    const d = parseTypedDate(s);
    if (d) setViewDate(d); // live-preview the month; commit on blur/Enter
  };

  const commitTyped = () => {
    if (typed === null) return;
    const raw = typed;
    setTyped(null);
    if (raw.trim() === '') {
      if (value) onChange?.(null);
      return;
    }
    const d = parseTypedDate(raw);
    if (d) {
      const nd = startOfDay(d);
      if (!sameDay(nd, value ?? null)) onChange?.(nd);
    }
    // invalid → typed cleared, input reverts to the formatted value
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitTyped();
      setOpen(false);
    } else if (e.key === 'Escape') {
      setTyped(null);
      setOpen(false);
    }
  };

  const handleDayClick = (d: Date) => {
    if (mode === 'single') {
      onChange?.(d);
      setOpen(false);
      return;
    }
    const cur = rangeValue ?? { start: null, end: null };
    if (!cur.start || (cur.start && cur.end)) {
      onRangeChange?.({ start: d, end: null });
    } else if (cur.start && !cur.end) {
      if (d < cur.start) {
        onRangeChange?.({ start: d, end: cur.start });
      } else {
        onRangeChange?.({ start: cur.start, end: d });
      }
      setOpen(false);
    }
  };

  const handleToday = () => {
    const today = startOfDay(new Date());
    setViewDate(today);
    if (mode === 'single') onChange?.(today);
    else onRangeChange?.({ start: today, end: today });
    setOpen(false);
  };

  const handleClear = () => {
    if (mode === 'single') onChange?.(null);
    else onRangeChange?.({ start: null, end: null });
  };

  const calendar = (
    <CalendarPanel
      viewDate={viewDate}
      setViewDate={setViewDate}
      mode={mode}
      value={value ?? null}
      rangeValue={rangeValue ?? { start: null, end: null }}
      rangeHover={rangeHover}
      setRangeHover={setRangeHover}
      onDayClick={handleDayClick}
      onToday={handleToday}
      onClear={handleClear}
      fromYear={fromYear}
      toYear={toYear}
      disabledDate={disabledDate}
      todayTestId={todayTestId}
      clearTestId={clearTestId}
    />
  );

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <DatePickerTrigger
        open={open}
        displayText={displayText}
        placeholder={ph}
        disabled={disabled}
        error={error}
        size={size}
        triggerTestId={triggerTestId}
        onClick={() => {
          if (disabled) return;
          const root = rootRef.current;
          if (root) {
            const dialog = root.closest('[role="dialog"]') as HTMLElement | null;
            setInsideDialog(dialog !== null);
            setAlignRight(dialog !== null && overflowsDialogRight(root, dialog));
          }
          setOpen((o) => !o);
        }}
        editable={editable}
        inputValue={typed !== null ? typed : displayText}
        onInputChange={handleInputChange}
        onInputFocus={handleInputFocus}
        onInputBlur={commitTyped}
        onInputKeyDown={handleInputKeyDown}
      />

      {open && !disabled && !portalled_ && (
        <div ref={panelRef} className={cn('absolute z-50 mt-2', alignRight ? 'right-0' : 'left-0')}>
          {calendar}
        </div>
      )}
      {open && !disabled && portalled_ && portalPos && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[1000]"
          style={{ top: portalPos.top, left: portalPos.left }}
        >
          {calendar}
        </div>,
        document.body,
      )}
    </div>
  );
}
