import { cn } from '@/lib/utils';

type SkeletonVariant = 'row' | 'table-rows' | 'kpi-tile' | 'avatar-row' | 'card';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  rowCount?: number;
  className?: string;
}

/**
 * Shimmer-animated skeleton placeholder. 5 variants.
 * Color: zinc-200 light / zinc-800 dark. Animation is Tailwind's `animate-pulse`.
 */
export function LoadingSkeleton({ variant = 'row', rowCount = 5, className }: LoadingSkeletonProps) {
  if (variant === 'row') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900',
          className
        )}
      >
        <Block w={18} h={18} r={3} />
        <Block w={90} h={10} />
        <Block w={220} h={10} />
        <div className="flex-1" />
        <Block w={70} h={10} />
        <Block w={60} h={18} r={999} />
      </div>
    );
  }

  if (variant === 'table-rows') {
    return (
      <div
        className={cn(
          'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden',
          className
        )}
      >
        <div className="flex items-center gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <Block w={14} h={14} r={2} />
          <Block w={70} h={9} />
          <Block w={100} h={9} />
          <Block w={80} h={9} />
          <div className="flex-1" />
          <Block w={50} h={9} />
        </div>
        {Array.from({ length: rowCount }).map((_, i) => (
          <LoadingSkeleton key={i} variant="row" />
        ))}
      </div>
    );
  }

  if (variant === 'kpi-tile') {
    return (
      <div
        className={cn(
          'p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg grid gap-3 w-[220px]',
          className
        )}
      >
        <Block w={60} h={9} />
        <Block w={100} h={28} r={6} />
        <Block w={80} h={8} />
      </div>
    );
  }

  if (variant === 'avatar-row') {
    return (
      <div className={cn('flex items-center gap-2.5', className)}>
        <Block w={32} h={32} r={999} />
        <div className="grid gap-1.5">
          <Block w={110} h={10} />
          <Block w={70} h={8} />
        </div>
      </div>
    );
  }

  // card
  return (
    <div
      className={cn(
        'p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg grid gap-3 w-[280px]',
        className
      )}
    >
      <Block w="60%" h={12} />
      <Block w="100%" h={120} r={6} />
      <div className="flex gap-2">
        <Block w={60} h={20} r={4} />
        <Block w={40} h={20} r={4} />
      </div>
      <Block w="85%" h={9} />
      <Block w="70%" h={9} />
    </div>
  );
}

function Block({ w, h = 10, r = 4 }: { w: number | string; h?: number | string; r?: number }) {
  return (
    <div
      className="bg-zinc-200 dark:bg-zinc-800 animate-pulse flex-shrink-0"
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: typeof h === 'number' ? `${h}px` : h,
        borderRadius: r,
      }}
    />
  );
}
