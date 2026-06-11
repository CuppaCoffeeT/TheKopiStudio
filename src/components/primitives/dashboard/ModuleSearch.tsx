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
        'bg-white dark:bg-zinc-950',
        'border border-zinc-200 dark:border-zinc-800 rounded-lg',
        'focus-within:border-red-700 dark:focus-within:border-red-400',
        'focus-within:ring-[3px] focus-within:ring-red-700/15 dark:focus-within:ring-red-400/20',
        'transition-colors',
        className
      )}
    >
      <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" strokeWidth={1.3} />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[13px] pointer-coarse:text-[16px] text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-600 dark:placeholder:text-zinc-400"
        style={{ fontFamily: 'var(--font-sans)' }}
      />
      {showShortcut && <Kbd>⌘K</Kbd>}
    </div>
  );
});
