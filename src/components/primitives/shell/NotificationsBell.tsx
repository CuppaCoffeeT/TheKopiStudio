/**
 * NotificationsBell — stateless bell-icon trigger + "Needs your attention" popover.
 *
 * Pure presentation primitive. Caller wires data via `useNotificationsBell()` (or any
 * equivalent hook) and passes `items` + `onPick`. Owns only its own popover open state.
 * Slotted into `AppHeader` via `notificationsSlot`.
 */
import { useState } from 'react';
import { AlertCircle, Bell, Check, ChevronRight } from 'lucide-react';
import { getModuleIcon } from '@/lib/iconLookup';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/primitives/overlays/Popover';
import { Badge } from './Badge';

export interface NotificationsBellItem {
  path: string;
  name: string;
  count: number;
  icon_name: string;
}

export interface NotificationsBellProps {
  items: NotificationsBellItem[];
  /** Sum of `items[].count`. Passed in (not derived) so the bell-dot rule and the header badge stay consistent with the caller's truth. */
  total: number;
  onPick: (path: string) => void;
}

export function NotificationsBell({ items, total, onPick }: NotificationsBellProps) {
  const [open, setOpen] = useState(false);

  const handlePick = (path: string) => {
    setOpen(false);
    onPick(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={total > 0 ? `Notifications — ${total} need attention` : 'Notifications — all caught up'}
          className="relative w-8 h-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Bell className="w-4 h-4" strokeWidth={1.3} />
          {total > 0 && (
            <span
              className="absolute top-[3px] right-[3px] w-[7px] h-[7px] rounded-full ring-[1.5px] ring-white dark:ring-zinc-950"
              style={{ background: 'var(--brand-red)' }}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[320px] p-0">
        <div className="px-3 pt-3 pb-2 flex items-center gap-2 border-b border-border">
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-red-500">
            Needs your attention
          </span>
          {total > 0 && (
            <Badge variant="count" className="ml-auto">
              {total}
            </Badge>
          )}
        </div>

        {items.length === 0 ? (
          <div className="px-3 py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            You're all caught up
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {items.map((item) => {
              const Icon = getModuleIcon(item.icon_name);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handlePick(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50/30 dark:hover:bg-red-950/20 focus-visible:outline-none focus-visible:bg-red-50/30 dark:focus-visible:bg-red-950/20 text-left"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 text-sm text-muted-foreground truncate">
                    {item.name}
                  </span>
                  {item.count > 0 && (
                    <Badge variant="count" className="shrink-0">
                      {item.count}
                    </Badge>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
