
import React from 'react';
import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count: number;
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({ count, className }) => {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-2 ml-2 text-xs font-bold text-destructive-foreground bg-destructive rounded-full",
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
