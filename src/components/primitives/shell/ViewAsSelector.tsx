/**
 * ViewAsSelector — stateless super_admin "test as user" control.
 *
 * Pure presentation primitive (32×32 Eye icon button + Popover with search +
 * scrollable user list + Exit). Caller wires data via `useViewAs()`
 * (or equivalent hook) and passes pre-sorted `users` + handlers.
 *
 * Self-guards: renders nothing when `realUser` is null or not super_admin —
 * the slot collapses on its own so callers don't need a role check.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/primitives/overlays/Popover';

export interface ViewAsSelectorUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ViewAsSelectorProps {
  realUser: { id: string; email: string; role: string } | null;
  /** Pre-filtered + pre-sorted active+approved users. Caller owns the data shape. */
  users: ViewAsSelectorUser[];
  /** The user id currently being impersonated, or null. */
  activeImpersonatedUserId: string | null;
  isImpersonating: boolean;
  impersonationLoading: boolean;
  onSelect: (userId: string) => void;
  onExit: () => void;
}

const formatRole = (r: string) => r.replace(/_/g, ' ');

export function ViewAsSelector({
  realUser,
  users,
  activeImpersonatedUserId,
  isImpersonating,
  impersonationLoading,
  onSelect,
  onExit,
}: ViewAsSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const q = query.toLowerCase().trim();
  const filtered = useMemo(
    () =>
      !q
        ? users
        : users.filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              u.role.toLowerCase().includes(q),
          ),
    [users, q],
  );

  if (!realUser || realUser.role !== 'super_admin') return null;

  const handleSelect = (userId: string) => {
    if (userId === realUser.id) return;
    onSelect(userId);
    setOpen(false);
  };

  const handleExit = () => {
    onExit();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={impersonationLoading ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="view-as-selector-trigger"
          aria-label={isImpersonating ? 'Test mode active — click to change' : 'Test as another user'}
          title={isImpersonating ? 'Test mode active' : 'Test as user'}
          className={cn(
            'w-8 h-8 rounded-md inline-flex items-center justify-center',
            'transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            isImpersonating
              ? 'border border-primary bg-primary/10 dark:bg-primary/15 text-primary hover:bg-primary/15 dark:hover:bg-primary/20'
              : 'text-muted-foreground hover:bg-secondary',
          )}
        >
          <Eye className="w-4 h-4" strokeWidth={1.3} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[300px] p-0 overflow-hidden">
        <div className="px-3 pt-2 pb-2" style={{ fontFamily: 'var(--font-sans)' }}>
          <div
            className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1"
          >
            YOU
          </div>
          <div
            className="text-[12.5px] text-foreground"
          >
            {realUser.email ?? 'Unknown'}
          </div>
          <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            {realUser.role ? formatRole(realUser.role) : ''}
          </div>
        </div>

        <div className="h-px bg-secondary" />

        <div
          className="px-3 pt-2 pb-1 text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
        >
          TEST AS — UI/UX + Playwright
        </div>

        <div className="px-3 pb-2">
          <div
            className={cn(
              'flex items-center gap-2 h-8 px-2 rounded-md',
              'bg-secondary',
              'border border-border',
              'focus-within:border-primary',
              'focus-within:ring-[2px] focus-within:ring-ring/15',
            )}
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.3} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users…"
              className="flex-1 bg-transparent border-none outline-none text-[12px] text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily: 'var(--font-sans)' }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="w-2.5 h-2.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto px-1.5 pb-1.5">
          {filtered.length === 0 && (
            <div className="py-6 text-center text-[11.5px] text-muted-foreground">
              {q ? `No users match "${query}"` : 'No users'}
            </div>
          )}
          {filtered.map((u) => {
            const isSelf = u.id === realUser.id;
            const isActive = isImpersonating && u.id === activeImpersonatedUserId;
            return (
              <button
                key={u.id}
                type="button"
                data-testid={`view-as-selector-option-${u.id}`}
                onClick={() => handleSelect(u.id)}
                disabled={isSelf}
                className={cn(
                  'w-full flex items-start gap-2.5 px-2 py-1.5 rounded text-left',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isSelf && 'opacity-40 cursor-not-allowed',
                  !isSelf && 'hover:bg-secondary cursor-pointer',
                )}
                title={isSelf ? 'This is your account' : undefined}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <span
                  className={cn(
                    'inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                    isActive ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-[12.5px] text-foreground truncate',
                      isActive && 'font-semibold',
                    )}
                  >
                    {u.name}{' '}
                    <span className="text-muted-foreground font-normal">({formatRole(u.role)})</span>
                  </div>
                  <div
                    className="text-[10.5px] text-muted-foreground truncate mt-px"
                  >
                    {u.email}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {isImpersonating && (
          <>
            <div className="h-px bg-secondary" />
            <div className="p-1">
              <button
                type="button"
                data-testid="view-as-selector-exit"
                onClick={handleExit}
                className={cn(
                  'w-full flex items-center justify-center gap-2 h-8 rounded',
                  'text-[12.5px] font-medium',
                  'text-primary',
                  'hover:bg-secondary',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                )}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Exit test
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
