/**
 * MarkdownProse — renders GFM markdown with prose typography matching SanitizedHtmlProse.
 *
 * No design spec — markdown-native twin of SanitizedHtmlProse, reuses its prose tokens;
 * built for SOP bodies (GFM + alert callouts + resolvable image srcs).
 * Long-form body copy is 13px, so it takes --fg-dim rather than the lighter
 * --fg-muted the sibling still uses for its body.
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
  /** Left rail — the family's `--status-*-dot`, the saturated mark of the pair. */
  accent: string;
  bg: string;
  text: string;
  label: string;
}

/**
 * GitHub's six alert kinds mapped onto the `--status-*` families in
 * `src/index.css`. Kopi 2a admits no categorical hues — status collapses to
 * sage positive · brown in-progress · terracotta negative — so the six kinds
 * share four families and lean on their icon + label for the finer distinction:
 * NOTE → draft (faint brown), IMPORTANT → revised (deeper brown),
 * TIP → accepted (sage), WARNING/CAUTION → sent (brown), ERROR → rejected
 * (terracotta).
 */
const ALERT_MAP: Record<AlertType, AlertDef> = {
  NOTE: {
    icon: Info,
    accent: 'border-[color:var(--status-draft-dot)]',
    bg: 'bg-[color:var(--status-draft-bg)]',
    text: 'text-[color:var(--status-draft-fg)]',
    label: 'Note',
  },
  TIP: {
    icon: Lightbulb,
    accent: 'border-[color:var(--status-accepted-dot)]',
    bg: 'bg-[color:var(--status-accepted-bg)]',
    text: 'text-[color:var(--status-accepted-fg)]',
    label: 'Tip',
  },
  WARNING: {
    icon: AlertTriangle,
    accent: 'border-[color:var(--status-sent-dot)]',
    bg: 'bg-[color:var(--status-sent-bg)]',
    text: 'text-[color:var(--status-sent-fg)]',
    label: 'Warning',
  },
  IMPORTANT: {
    icon: AlertCircle,
    accent: 'border-[color:var(--status-revised-dot)]',
    bg: 'bg-[color:var(--status-revised-bg)]',
    text: 'text-[color:var(--status-revised-fg)]',
    label: 'Important',
  },
  ERROR: {
    icon: XCircle,
    accent: 'border-[color:var(--status-rejected-dot)]',
    bg: 'bg-[color:var(--status-rejected-bg)]',
    text: 'text-[color:var(--status-rejected-fg)]',
    label: 'Error',
  },
  CAUTION: {
    icon: AlertTriangle,
    accent: 'border-[color:var(--status-sent-dot)]',
    bg: 'bg-[color:var(--status-sent-bg)]',
    text: 'text-[color:var(--status-sent-fg)]',
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
// Prose class string (tracks SanitizedHtmlProse; body copy takes --fg-dim)
// ---------------------------------------------------------------------------

const PROSE_CLASSES = cn(
  'text-[13px] leading-[1.6] text-[color:var(--fg-dim)]',
  '[&_p]:mb-2 [&_p]:mt-0',
  '[&_strong]:text-foreground',
  '[&_a]:text-[color:var(--brown-text)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[color:var(--cta-primary-bg-hover)]',
  '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-secondary',
  '[&_pre]:bg-secondary [&_pre]:rounded [&_pre]:px-3 [&_pre]:py-2 [&_pre]:overflow-x-auto',
  '[&_code]:bg-secondary [&_code]:rounded [&_code]:px-1 [&_code]:text-[12px]',
  '[&_hr]:border-border',
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
            <span className="block text-[11.5px] text-muted-foreground mt-1 text-center">
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
          className="text-[color:var(--brown-text)] underline underline-offset-2 hover:text-[color:var(--cta-primary-bg-hover)]"
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
        <code className="bg-secondary rounded px-1 text-[12px]">
          {children}
        </code>
      );
    },

    // ---- pre: code block wrapper -----------------------------------------
    pre({ children }) {
      return (
        <pre className="bg-secondary rounded px-3 py-2 overflow-x-auto my-2 text-[12px]">
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
        <th className="border border-border px-2 py-1 bg-secondary text-left font-semibold text-foreground">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border border-border px-2 py-1">
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
