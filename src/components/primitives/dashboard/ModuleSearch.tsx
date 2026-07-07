import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd } from '../overlays/Kbd';

interface ModuleSearchProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  /** Show ⌘K shortcut hint inline-right */
  showShortcut?: boolean;
}

/**
 * Search input used on /dashboard when the user has > 6 modules.
 * Filters the dashboard category sections below by name. Debounce is caller's responsibility.
 */
export const ModuleSearch = forwardRef<HTMLInputElement, ModuleSearchProps>(function ModuleSearch(
  { value, onChange, placeholder = 'Search modules...', className, showShortcut = true },
  ref
) {
  return (
    <div
      className={cn(
        'w-full h-[42px] px-3.5 flex items-center gap-2.5',
        'bg-card',
        'border border-border rounded-lg',
        'focus-within:border-ring',
        'focus-within:ring-[3px] focus-within:ring-ring/15',
        'transition-colors',
        className
      )}
    >
      <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.3} />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[13px] pointer-coarse:text-[16px] text-foreground placeholder:text-muted-foreground"
        style={{ fontFamily: 'var(--font-sans)' }}
      />
      {showShortcut && <Kbd>⌘K</Kbd>}
    </div>
  );
});
