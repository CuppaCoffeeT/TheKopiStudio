import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Textarea — auto-grow multi-line input with optional char counter.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: focus ring red-700 never silent; counter turns red when used > max.
 */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  autoGrow?: boolean;
  minHeight?: number;
  maxHeight?: number;
  counter?: { used: number; max: number };
  containerClassName?: string;
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    error = false,
    autoGrow = true,
    minHeight = 88,
    maxHeight = 220,
    counter,
    className,
    containerClassName,
    disabled,
    value,
    onChange,
    ...props
  },
  ref
) {
  const localRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    if (!autoGrow) return;
    const el = localRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(maxHeight, Math.max(minHeight, el.scrollHeight));
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [autoGrow, minHeight, maxHeight]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
      <div
        className={cn(
          'rounded-lg border transition-[box-shadow,border-color] duration-150',
          error
            ? 'border-red-700 dark:border-red-400'
            : 'border-zinc-300 dark:border-zinc-700',
          !disabled && !error && 'hover:border-zinc-400 dark:hover:border-zinc-600',
          !error &&
            'focus-within:border-red-700 dark:focus-within:border-red-400 focus-within:ring-[3px] focus-within:ring-red-700/15 dark:focus-within:ring-red-400/25',
          error &&
            'focus-within:ring-[3px] focus-within:ring-red-700/15 dark:focus-within:ring-red-400/25',
          disabled ? 'bg-zinc-100 dark:bg-zinc-900 opacity-80' : 'bg-white dark:bg-zinc-950'
        )}
      >
        <textarea
          ref={mergeRefs(ref, localRef)}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange?.(e);
            resize();
          }}
          className={cn(
            'w-full px-3 py-2.5 bg-transparent outline-none resize-none',
            'text-[14px] pointer-coarse:text-[16px] leading-[1.5]',
            'text-zinc-900 dark:text-zinc-50',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
            disabled && 'cursor-not-allowed',
            className
          )}
          style={{
            fontFamily: 'var(--font-sans)',
            minHeight,
            maxHeight,
          }}
          {...props}
        />
      </div>
      {counter && (
        <div
          className={cn(
            'self-end tabular-nums',
            counter.used > counter.max
              ? 'text-red-700 dark:text-red-400'
              : 'text-zinc-500 dark:text-zinc-400'
          )}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          {counter.used} / {counter.max}
        </div>
      )}
    </div>
  );
});
