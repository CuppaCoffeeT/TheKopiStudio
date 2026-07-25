/**
 * Card — AppBase design-system card surface.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-cards.html
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked:
 *   Radius 16px (2xl) · padding 20px · --border hairline at 80% alpha
 *   Shadow rest: NONE. 2a cards lift by the cream-on-cream colour step
 *     (#FAF6EE card on the #F0E6D6 page), not by a shadow. Only interactive
 *     cards cast one, and only on hover: --card-shadow-hover (warm ink) +
 *     --border-hover + a 1-px lift.
 *   Translucent variant for marketing/hero surfaces ONLY — never on data surfaces.
 *
 * Replaces shadcn `@/components/ui/card` everywhere in new code.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type CardTone = 'default' | 'translucent';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  /** Interactive (hover-lift + cursor-pointer). Do not pair with `as="button"` unless you handle keyboard semantics. */
  interactive?: boolean;
  /** Override padding — default `p-5` (20px). Pass `p-0` for edge-to-edge content like tables. */
  padding?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone = 'default', interactive = false, padding, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl',
        padding ?? 'p-5',
        tone === 'translucent'
          ? 'bg-card/70 backdrop-blur-md backdrop-saturate-150 border border-border/60'
          : cn(
              'bg-card text-card-foreground',
              'border border-border/80',
              'shadow-[var(--card-shadow-rest)]',
              interactive &&
                'transition-all duration-150 hover:-translate-y-px hover:shadow-[var(--card-shadow-hover)] hover:border-[color:var(--border-hover)] cursor-pointer',
            ),
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {children}
    </div>
  );
});

// ─── Header / Title / Description / Content / Footer ─────────────────

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 mb-3', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4';
}

export function CardTitle({ as: As = 'h2', className, children, ...props }: CardTitleProps) {
  return (
    <As
      className={cn(
        'text-[16px] font-medium leading-tight text-foreground m-0',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}
      {...props}
    >
      {children}
    </As>
  );
}

type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn('text-[12.5px] leading-relaxed text-muted-foreground m-0', className)}
      {...props}
    >
      {children}
    </p>
  );
}

type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      {children}
    </div>
  );
}

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn('flex items-center gap-2 pt-4 mt-3 border-t border-border', className)} {...props}>
      {children}
    </div>
  );
}
