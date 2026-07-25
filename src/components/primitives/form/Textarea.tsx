import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Textarea — auto-grow multi-line input with optional char counter.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked (2a): focus outline is a solid 2px brown (--cta-primary-bg) and never silent; error
 * uses the terracotta --destructive border with a solid --negative-text focus outline; the
 * counter turns --negative-text when used > max.
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
          error ? 'border-destructive' : 'border-border',
          !disabled && !error && 'hover:border-border',
          !error &&
            'focus-within:border-ring focus-within:outline-2 focus-within:outline-[color:var(--cta-primary-bg)] focus-within:outline-offset-1',
          error &&
            'focus-within:outline-2 focus-within:outline-[color:var(--negative-text)] focus-within:outline-offset-1',
          disabled ? 'bg-secondary opacity-80' : 'bg-card'
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
            'text-[13px] pointer-coarse:text-[16px] leading-[1.5]',
            'text-foreground',
            'placeholder:text-muted-foreground',
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
              ? 'text-[color:var(--negative-text)]'
              : 'text-muted-foreground'
          )}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        >
          {counter.used} / {counter.max}
        </div>
      )}
    </div>
  );
});
