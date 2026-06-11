/**
 * MarkdownProse — renders GFM markdown with prose typography matching SanitizedHtmlProse.
 *
 * No design spec — markdown-native twin of SanitizedHtmlProse, reuses its prose tokens;
 * built for SOP bodies (GFM + alert callouts + resolvable image srcs).
 *
 * Adopters: tracked in DESIGN_CATALOG_PRIMITIVES.md `Adopted` column.
 *
 * Locked:
 *   - No rehype-raw / rehype-sanitize — raw HTML is intentionally disabled (XSS-safe default).
 *   - No data fetching, no Supabase. Pure presentation.
 *   - Alert detection is first-line-only (GitHub spec).
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Info,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Components } from 'react-markdown';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Alert callout types
// ---------------------------------------------------------------------------

type AlertType = 'NOTE' | 'TIP' | 'WARNING' | 'IMPORTANT' | 'ERROR' | 'CAUTION';

const ALERT_RE = /^\[!(NOTE|TIP|WARNING|IMPORTANT|ERROR|CAUTION)\]\s*/i;

interface AlertDef {
  icon: typeof Info;
  accent: string;
  bg: string;
  text: string;
  label: string;
}

const ALERT_MAP: Record<AlertType, AlertDef> = {
  NOTE: {
    icon: Info,
    accent: 'border-blue-400 dark:border-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-800 dark:text-blue-300',
    label: 'Note',
  },
  TIP: {
    icon: Lightbulb,
    accent: 'border-green-400 dark:border-green-600',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-800 dark:text-green-300',
    label: 'Tip',
  },
  WARNING: {
    icon: AlertTriangle,
    accent: 'border-amber-400 dark:border-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-800 dark:text-amber-300',
    label: 'Warning',
  },
  IMPORTANT: {
    icon: AlertCircle,
    accent: 'border-purple-400 dark:border-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-800 dark:text-purple-300',
    label: 'Important',
  },
  ERROR: {
    icon: XCircle,
    accent: 'border-red-400 dark:border-red-600',
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-800 dark:text-red-300',
    label: 'Error',
  },
  CAUTION: {
    icon: AlertTriangle,
    accent: 'border-orange-400 dark:border-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-800 dark:text-orange-300',
    label: 'Caution',
  },
};

// ---------------------------------------------------------------------------
// Helper — extract alert type + remaining text from blockquote children
// ---------------------------------------------------------------------------

function extractAlertText(children: ReactNode): { type: AlertType; body: string } | null {
  const nodes = Array.isArray(children) ? children : [children];
  for (const node of nodes) {
    if (node && typeof node === 'object' && 'props' in (node as object)) {
      const el = node as React.ReactElement<{ children?: ReactNode }>;
      const inner = el.props?.children;
      const text = typeof inner === 'string' ? inner : stringifyChildren(inner);
      const match = text.match(ALERT_RE);
      if (match) {
        const type = match[1].toUpperCase() as AlertType;
        const body = text.replace(ALERT_RE, '').trim();
        return { type, body };
      }
    }
  }
  return null;
}

function stringifyChildren(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(stringifyChildren).join('');
  if (node && typeof node === 'object' && 'props' in (node as object)) {
    const el = node as React.ReactElement<{ children?: ReactNode }>;
    return stringifyChildren(el.props?.children);
  }
  return '';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MarkdownProseProps {
  markdown: string;
  className?: string;
  /** Optional image src resolver — called with every raw `src` from the markdown. */
  resolveImageSrc?: (rawSrc: string) => string;
}

// ---------------------------------------------------------------------------
// Prose class string (mirrors SanitizedHtmlProse exactly)
// ---------------------------------------------------------------------------

const PROSE_CLASSES = cn(
  'text-[13px] leading-[1.6] text-zinc-700 dark:text-zinc-300',
  '[&_p]:mb-2 [&_p]:mt-0',
  '[&_strong]:text-zinc-900 [&_strong]:dark:text-zinc-100',
  '[&_a]:text-blue-700 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-800 hover:[&_a]:dark:text-blue-300',
  '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-zinc-200 [&_blockquote]:dark:border-zinc-700 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-500 [&_blockquote]:dark:text-zinc-400',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-zinc-200 [&_td]:dark:border-zinc-800 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-zinc-200 [&_th]:dark:border-zinc-800 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-zinc-50 [&_th]:dark:bg-zinc-900',
  '[&_pre]:bg-zinc-100 [&_pre]:dark:bg-zinc-900 [&_pre]:rounded [&_pre]:px-3 [&_pre]:py-2 [&_pre]:overflow-x-auto',
  '[&_code]:bg-zinc-100 [&_code]:dark:bg-zinc-900 [&_code]:rounded [&_code]:px-1 [&_code]:text-[12px]',
  '[&_hr]:border-zinc-200 [&_hr]:dark:border-zinc-800',
  'overflow-x-auto',
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarkdownProse({ markdown, className, resolveImageSrc }: MarkdownProseProps) {
  const components: Components = {
    // ---- blockquote: GitHub alert detection --------------------------------
    blockquote({ children }) {
      const alert = extractAlertText(children);
      if (alert) {
        const def = ALERT_MAP[alert.type];
        const Icon = def.icon;
        return (
          <div
            className={cn(
              'flex gap-2.5 rounded-md border-l-4 px-3 py-2.5 my-3',
              def.accent,
              def.bg,
              def.text,
            )}
            role="note"
            aria-label={def.label}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0">
              <span className="font-semibold mr-1.5">{def.label}:</span>
              <span className="text-[13px] leading-[1.6]">{alert.body}</span>
            </div>
          </div>
        );
      }
      // Normal blockquote — rendered by prose wrapper classes via [&_blockquote]
      return <blockquote>{children}</blockquote>;
    },

    // ---- image: resolve src + responsive wrapper --------------------------
    img({ src, alt }) {
      const resolved = resolveImageSrc && src ? resolveImageSrc(src) : (src ?? '');
      return (
        <span className="block my-2">
          <img
            src={resolved}
            alt={alt ?? ''}
            loading="lazy"
            className="max-w-full h-auto rounded"
          />
          {alt && (
            <span className="block text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-1 text-center">
              {alt}
            </span>
          )}
        </span>
      );
    },

    // ---- anchor: external → new tab with rel noreferrer -------------------
    a({ href, children }) {
      const isExternal = href ? /^https?:\/\//i.test(href) : false;
      return (
        <a
          href={href}
          {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
          className="text-blue-700 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300"
        >
          {children}
        </a>
      );
    },

    // ---- code: inline vs block -------------------------------------------
    code({ children, className: codeClass }) {
      const isBlock = Boolean(codeClass);
      if (isBlock) {
        // Inside a <pre> — let pre classes handle it
        return <code className={codeClass}>{children}</code>;
      }
      return (
        <code className="bg-zinc-100 dark:bg-zinc-900 rounded px-1 text-[12px]">
          {children}
        </code>
      );
    },

    // ---- pre: code block wrapper -----------------------------------------
    pre({ children }) {
      return (
        <pre className="bg-zinc-100 dark:bg-zinc-900 rounded px-3 py-2 overflow-x-auto my-2 text-[12px]">
          {children}
        </pre>
      );
    },

    // ---- table: bordered prose table -------------------------------------
    table({ children }) {
      return (
        <div className="overflow-x-auto my-3">
          <table className="border-collapse w-full text-[12.5px]">{children}</table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th className="border border-zinc-200 dark:border-zinc-800 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 text-left font-semibold text-zinc-900 dark:text-zinc-100">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border border-zinc-200 dark:border-zinc-800 px-2 py-1">
          {children}
        </td>
      );
    },
  };

  return (
    <div
      className={cn('markdown-prose', PROSE_CLASSES, className)}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
