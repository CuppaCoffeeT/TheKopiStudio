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
 * Terracotta-tint strip (--red-soft) rendered directly under AppHeader when
 * super_admin is impersonating. Pulsing --brand-terracotta dot +
 * "Test mode · Engineer" + keyboard shortcut hint. Copy is 12px, so it takes
 * the AA-safe --negative-text step, not the raw terracotta fill.
 *
 * The account email recedes via a COLOUR step (--fg-dim, 6.29:1 on --red-soft),
 * never an alpha knock-down: --negative-text at 80% composites to ~#BB6748 and
 * measures 3.24:1. This strip is safety-critical chrome — it tells a super_admin
 * whose account they are acting as — so every glyph on it stays above AA.
 */
export function ImpersonationBanner({ role, email = 'agent@example.com', onExit, className }: ImpersonationBannerProps) {
  return (
    <div
      className={cn(
        'h-8 flex items-center gap-3 px-5',
        'bg-[color:var(--red-soft)]',
        'border-b border-[color:var(--status-rejected-border)]',
        'text-[color:var(--negative-text)]',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      role="status"
      aria-live="polite"
    >
      <span className="relative w-2 h-2 inline-block" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-[color:var(--brand-terracotta)]" />
        <span className="absolute -inset-0.5 rounded-full border-[1.5px] border-[color:var(--brand-terracotta)] opacity-50 animate-ping" />
      </span>
      <span className="text-xs font-medium">
        Test mode · <strong className="font-bold">{role}</strong>
        <span className="ml-2 text-[color:var(--fg-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>
          · {email}
        </span>
      </span>
      <div className="flex-1" />
      {onExit && (
        <button
          onClick={onExit}
          className="inline-flex items-center gap-2 text-xs font-medium text-[color:var(--negative-text)] hover:underline"
        >
          Exit test
          <Kbd className="border-[color:var(--status-rejected-border)] bg-transparent">⌘⇧I</Kbd>
        </button>
      )}
    </div>
  );
}
