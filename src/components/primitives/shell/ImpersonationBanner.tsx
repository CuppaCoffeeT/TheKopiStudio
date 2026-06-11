import { cn } from '@/lib/utils';
import { Kbd } from '../overlays/Kbd';

interface ImpersonationBannerProps {
  /** The role being impersonated (e.g. "Engineer") */
  role: string;
  /** The demo account email — typically `agent@example.com` */
  email?: string;
  onExit?: () => void;
  className?: string;
}

/**
 * Red-50 strip rendered directly under AppHeader when super_admin is impersonating.
 * Pulsing red-700 dot + "Test mode · Engineer" + keyboard shortcut hint.
 */
export function ImpersonationBanner({ role, email = 'agent@example.com', onExit, className }: ImpersonationBannerProps) {
  return (
    <div
      className={cn(
        'h-8 flex items-center gap-3 px-5',
        'bg-red-50 dark:bg-red-950/30',
        'border-b border-red-200 dark:border-red-900/50',
        'text-red-700 dark:text-red-400',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      role="status"
      aria-live="polite"
    >
      <span className="relative w-2 h-2 inline-block" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-red-700 dark:bg-red-400" />
        <span className="absolute -inset-0.5 rounded-full border-[1.5px] border-red-700 dark:border-red-400 opacity-50 animate-ping" />
      </span>
      <span className="text-xs font-medium">
        Test mode · <strong className="font-bold">{role}</strong>
        <span className="ml-2 opacity-80" style={{ fontFamily: 'var(--font-mono)' }}>
          · {email}
        </span>
      </span>
      <div className="flex-1" />
      {onExit && (
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-400 hover:underline"
        >
          Exit test
          <Kbd className="border-red-300 dark:border-red-900/50 bg-transparent">⌘⇧I</Kbd>
        </button>
      )}
    </div>
  );
}
