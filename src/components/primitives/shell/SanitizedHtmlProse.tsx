/**
 * SanitizedHtmlProse — renders user-provided HTML safely with prose typography.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-msg-body .prose`)
 * Adopters: EmailMessageCard (email bodies); reusable for notification archives,
 * internal memos, any user-authored HTML.
 *
 * Responsibilities:
 *   1. DOMPurify sanitization with the correct `ALLOWED_TAGS` / `ALLOWED_ATTR` keys
 *      (common mistake: `ALLOW_TAGS` is ignored — DOMPurify falls back to defaults).
 *   2. CID resolution — `<img src="cid:xxx">` rewritten to signed storage URL
 *      from the `cidMap` prop before sanitize.
 *   3. External image policy — default `prompt` blocks `http(s)` images and shows
 *      a "Show images" banner (Gmail-style — prevents read-receipt tracking).
 *   4. Prose tokens driven by the design system — never Tailwind Typography defaults.
 *   5. Full dark-mode support (prose, tables, blockquotes, images, links).
 *
 * Pure / side-effect free: no Supabase, no queries, no auth. Feature layer owns
 * `cidMap` resolution + per-sender trust policy.
 */

import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ImagePolicy = 'auto' | 'prompt' | 'blocked';

interface SanitizedHtmlProseProps {
  /** Raw HTML from e.g. `email.body_html`. */
  html: string;
  /** `content_id` → resolved signed URL (feature layer fetches these). */
  cidMap?: Record<string, string>;
  /** External image loading policy. Default `"prompt"`. */
  imagePolicy?: ImagePolicy;
  /** Called when user clicks "Show images" in the banner. */
  onLoadImages?: () => void;
  className?: string;
}

const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span', 'a', 'b', 'strong', 'i', 'em', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img',
  'blockquote', 'pre', 'code', 'hr',
  'font', 'sub', 'sup',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'style', 'class', 'target', 'rel',
  'width', 'height',
  'color', 'face', 'size', 'align', 'valign', 'bgcolor',
  'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan',
];

interface PreparedHtml {
  html: string;
  externalImageCount: number;
}

function prepareHtml(
  raw: string,
  cidMap: Record<string, string>,
  policy: ImagePolicy,
): PreparedHtml {
  if (typeof window === 'undefined') {
    return { html: '', externalImageCount: 0 };
  }

  // 1. Parse in a sandbox document so we can walk <img> nodes safely before sanitize.
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${raw}</body>`, 'text/html');

  let externalImageCount = 0;
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (src.startsWith('cid:')) {
      const cid = src.slice(4);
      const resolved = cidMap[cid] ?? cidMap[`<${cid}>`];
      if (resolved) {
        img.setAttribute('src', resolved);
      } else {
        img.removeAttribute('src');
        img.setAttribute('data-cid-missing', cid);
      }
    } else if (/^https?:\/\//i.test(src)) {
      if (policy !== 'auto') {
        img.setAttribute('data-deferred-src', src);
        img.removeAttribute('src');
        externalImageCount += 1;
      }
    }
    // Force external links to open in a new tab w/ noopener.
    if (img.closest('a')) {
      const anchor = img.closest('a');
      if (anchor && anchor.getAttribute('href')?.startsWith('http')) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  // Harden all remaining anchors.
  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  const sanitized = DOMPurify.sanitize(doc.body.innerHTML, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target'],
  });
  return { html: String(sanitized), externalImageCount };
}

export function SanitizedHtmlProse({
  html,
  cidMap,
  imagePolicy = 'prompt',
  onLoadImages,
  className,
}: SanitizedHtmlProseProps) {
  const [revealed, setRevealed] = useState(imagePolicy === 'auto');
  const effectivePolicy: ImagePolicy = revealed ? 'auto' : imagePolicy;

  const prepared = useMemo(
    () => prepareHtml(html, cidMap ?? {}, effectivePolicy),
    [html, cidMap, effectivePolicy],
  );

  const handleShowImages = () => {
    setRevealed(true);
    onLoadImages?.();
  };

  return (
    <div className={cn('sanitized-html-prose', className)}>
      {!revealed && imagePolicy === 'prompt' && prepared.externalImageCount > 0 && (
        <div
          className={cn(
            'flex items-center gap-2 mb-3 px-3 py-2 rounded-md border text-[11.5px]',
            'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40',
            'text-amber-800 dark:text-amber-300',
          )}
          role="status"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <ImageOff className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="flex-1">
            {prepared.externalImageCount} image{prepared.externalImageCount === 1 ? '' : 's'} hidden for privacy.
          </span>
          <button
            type="button"
            onClick={handleShowImages}
            className={cn(
              'h-6 px-2 rounded border text-[11px] font-medium whitespace-nowrap',
              'border-amber-300 dark:border-amber-800 bg-card',
              'text-amber-800 dark:text-amber-200',
              'hover:bg-amber-100 dark:hover:bg-amber-900/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            )}
          >
            Show images
          </button>
        </div>
      )}
      <div
        className={cn(
          'text-[13px] leading-[1.6] text-muted-foreground',
          '[&_p]:mb-2 [&_p]:mt-0',
          '[&_strong]:text-foreground',
          '[&_a]:text-blue-700 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-800 hover:[&_a]:dark:text-blue-300',
          '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-secondary',
          '[&_pre]:bg-secondary [&_pre]:rounded [&_pre]:px-3 [&_pre]:py-2 [&_pre]:overflow-x-auto',
          '[&_code]:bg-secondary [&_code]:rounded [&_code]:px-1 [&_code]:text-[12px]',
          '[&_hr]:border-border',
          'overflow-x-auto',
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        dangerouslySetInnerHTML={{ __html: prepared.html }}
      />
    </div>
  );
}
