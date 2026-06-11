/**
 * NotFound — 404 page.
 *
 * Signature-moment design: massive Geist Pixel Square "404" wordmark +
 * short explanation + the offending path in Geist Mono + 2 CTAs (primary
 * back-to-dashboard, ghost browser-back).
 *
 * Visual language: consistent with W08 tokens — page-bg flat zinc-100/
 * zinc-900, slate-800 primary CTA, red-700 brand accent dot, Roboto body,
 * Geist Pixel crisp for the 404 + Geist Mono for the failed-path chip.
 *
 * Respects the global ThemeProvider — adapts to light/dark automatically.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { Button, PageTitle } from '@/components/primitives/shell';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('404 Error: route not found:', location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'var(--page-bg)', color: 'var(--fg)' }}
    >
      {/* Subtle red accent dot — signature moment, barely visible */}
      <div
        aria-hidden
        className="absolute top-8 right-8 w-2 h-2 rounded-full"
        style={{ background: 'var(--brand-red)' }}
      />

      <div className="max-w-2xl w-full flex flex-col items-center text-center">
        {/* Massive 404 — the display moment. Uses --font-pixel-display (Grid
            variant) for visible pixel grain at scale. Rule: h1 ≤ 48px → Square;
            display ≥ 140px → Grid. */}
        <PageTitle
          className="mb-4 select-none"
          style={{
            fontFamily: 'var(--font-pixel-display)',
            fontSize: 'clamp(140px, 22vw, 280px)',
            lineHeight: 0.82,
            color: 'var(--fg)',
            letterSpacing: '-0.02em',
          }}
        >
          404
        </PageTitle>

        {/* Sub-header in Geist Mono (subheader font) */}
        <div
          className="text-sm uppercase tracking-[0.2em] mb-2"
          style={{
            fontFamily: 'var(--font-subheader)',
            color: 'var(--fg-muted)',
          }}
        >
          Page not found
        </div>

        {/* Body in Roboto */}
        <p
          className="text-base max-w-md mb-4 leading-relaxed"
          style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)' }}
        >
          We couldn't find anything at that address. It may have moved, been renamed, or never existed.
        </p>

        {/* The failed path — Geist Mono chip */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border mb-8 max-w-full"
          style={{
            background: 'var(--surface-subtle)',
            borderColor: 'var(--border-soft)',
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--brand-red)' }}>×</span>
          <span
            className="truncate"
            style={{ maxWidth: '60vw' }}
            title={location.pathname + location.search}
          >
            {location.pathname + location.search}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="primary"
            size="md"
            leadingIcon={<Home className="h-4 w-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </Button>
          <Button
            variant="outline"
            size="md"
            leadingIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
        </div>
      </div>

      {/* Footer meta — tiny, tucked */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px]"
        style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
      >
        AppBase · error 404
      </div>
    </div>
  );
};

export default NotFound;
