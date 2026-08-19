/**
 * DatePicker.dropdown — invisible-native-<select> behind a mono chip (used for month + year in CalendarPanel).
 */
import { ChevronDown } from 'lucide-react';

interface MonoDropdownProps {
  /** The visible chip text — the CURRENT value, e.g. "Mar" or "1986". */
  label: string;
  /**
   * The accessible name — what the control SELECTS, e.g. "Month" or "Year".
   * Separate from `label` because the chip shows the current value: using it
   * for both announced the year picker as "1986", which names the value and
   * never says what changing it does.
   */
  name: string;
  value: number;
  options: { label: string; value: number }[];
  onChange: (v: number) => void;
}

export function MonoDropdown({ label, name, value, options, onChange }: MonoDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={name}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span
        className="inline-flex items-center gap-1 h-[26px] px-2.5 rounded-md border border-border text-muted-foreground pointer-events-none"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
      >
        {label} <ChevronDown size={9} />
      </span>
    </div>
  );
}
