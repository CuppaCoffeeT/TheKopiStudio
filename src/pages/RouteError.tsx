/**
 * RouteError — React Router errorElement.
 *
 * Mirrors NotFound.tsx aesthetic (massive Geist Pixel Grid code, uppercase mono
 * sub-header, Roboto body, mono path chip w/ red ×, slate-800 + ghost CTAs,
 * red-700 accent dot). Difference: the big code is "500" (or whatever HTTP code
 * the error carries), and the path chip shows the error message instead of URL.
 */
import { useEffect } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button, PageTitle } from '@/components/primitives/shell';

const RouteError = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  let code = 'ERR';
  let subhead = 'Unexpected application error';
  let message = 'Something went wrong rendering this page.';

  if (isRouteErrorResponse(error)) {
    code = String(error.status);
    subhead = error.statusText || 'Route error';
    message = (error.data && typeof error.data === 'string' ? error.data : '') || message;
  } else if (error instanceof Error) {
    code = '500';
    subhead = error.name || 'Application error';
    message = error.message || message;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden"
      style={{ background: 'var(--page-bg)', color: 'var(--fg)' }}
    >
      <div
        aria-hidden
        className="absolute top-8 right-8 w-2 h-2 rounded-full"
        style={{ background: 'var(--brand-red)' }}
      />

      <div className="max-w-2xl w-full flex flex-col items-center text-center">
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
          {code}
        </PageTitle>

        <div
          className="text-sm uppercase tracking-[0.2em] mb-2"
          style={{ fontFamily: 'var(--font-subheader)', color: 'var(--fg-muted)' }}
        >
          {subhead}
        </div>

        <p
          className="text-base max-w-md mb-4 leading-relaxed"
          style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-sans)' }}
        >
          The page couldn't render. Your work is preserved — try again in a moment, or send us a report if this keeps happening.
        </p>

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
            title={message}
          >
            {message}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="primary"
            size="md"
            leadingIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => window.location.reload()}
          >
            Retry
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

      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px]"
        style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
      >
        AppBase · error {code}
      </div>
    </div>
  );
};

export default RouteError;
