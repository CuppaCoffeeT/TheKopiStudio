import { type ReactNode } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import { Kbd } from './Kbd';

interface CommandPaletteGroupProps {
  heading?: string;
  children: ReactNode;
  className?: string;
}

export function CommandPaletteGroup({ heading, children, className }: CommandPaletteGroupProps) {
  return (
    <CommandPrimitive.Group heading={heading} className={className}>
      {children}
    </CommandPrimitive.Group>
  );
}

export function CommandPaletteSeparator({ className }: { className?: string }) {
  return (
    <CommandPrimitive.Separator
      className={cn('h-px my-1 -mx-1 bg-border', className)}
    />
  );
}

export function CommandPaletteEmpty({ children }: { children: ReactNode }) {
  return (
    <CommandPrimitive.Empty className="py-4 px-3 text-center text-[12px] text-muted-foreground">
      {children}
    </CommandPrimitive.Empty>
  );
}

interface CommandPaletteItemProps {
  /**
   * Unique value used for cmdk fuzzy ranking AND item identity. MUST be unique
   * across the whole palette — prefix with section + stable id, e.g.
   *   value={`${sectionKey}:${path}:${name}`}.
   *
   * Put the PRIMARY searchable text (e.g. module name) in `value`. cmdk
   * weights `value` higher than `keywords`, so name matches outrank
   * description-only matches.
   */
  value: string;
  /** Secondary searchable strings (lower weight than `value`). */
  keywords?: string[];
  onSelect: () => void;
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  shortcut?: string;
  destructive?: boolean;
}

export function CommandPaletteItem({
  value,
  keywords,
  onSelect,
  icon,
  label,
  description,
  shortcut,
  destructive = false,
}: CommandPaletteItemProps) {
  return (
    <CommandPrimitive.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className={cn(
        'flex items-start gap-2.5 px-2 py-2 rounded cursor-pointer outline-none select-none',
        // cmdk marks the arrow-key row with data-[selected], and the row sets
        // outline-none, so the global :focus-visible brown ring never fires here.
        // A flat tint on the cream glass surface is ~1.05:1 — no visible indicator
        // at all. Same contract as DropdownMenuItem/SelectMenuItem: an inset brown
        // ring carries the selection, --row-selected (12%) fills it.
        'data-[selected=true]:bg-[color:var(--row-selected)]',
        'data-[selected=true]:ring-2 data-[selected=true]:ring-inset data-[selected=true]:ring-ring',
        destructive ? 'text-[color:var(--negative-text)]' : 'text-foreground'
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {icon !== undefined && (
        <span
          className={cn(
            'w-4 h-4 mt-[1px] flex-shrink-0 flex items-center justify-center',
            destructive ? 'text-[color:var(--negative-text)]' : 'text-muted-foreground'
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium leading-snug truncate">{label}</div>
        {description && (
          <div
            className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate"
          >
            {description}
          </div>
        )}
      </div>
      {shortcut && <Kbd className="ml-2 mt-[2px] flex-shrink-0">{shortcut}</Kbd>}
    </CommandPrimitive.Item>
  );
}
