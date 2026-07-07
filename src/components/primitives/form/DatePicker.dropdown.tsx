/**
 * DatePicker.dropdown — invisible-native-<select> behind a mono chip (used for month + year in CalendarPanel).
 */
import { ChevronDown } from 'lucide-react';

interface MonoDropdownProps {
  label: string;
  value: number;
  options: { label: string; value: number }[];
  onChange: (v: number) => void;
}

export function MonoDropdown({ label, value, options, onChange }: MonoDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
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
