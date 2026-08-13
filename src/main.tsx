
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';

// Fonts are not bundled. The Kopi Studio stack (Instrument Serif + IBM Plex
// Sans) is served from Google Fonts via the <link> in index.html per the brand
// card; --font-mono resolves to the platform mono stack. The former
// @fontsource Roboto / Geist Mono imports were dropped 2026-07-25 — no token
// referenced either family any more.
import './index.css';
import 'react-photo-view/dist/react-photo-view.css';
import { suppressExtensionErrors } from './utils/suppressExtensionErrors';
import { AuthProvider } from './contexts/AuthContext';

// Suppress browser extension errors in console
suppressExtensionErrors();

// Stale-deploy recovery. After a new deploy, a browser tab still running the
// previous build holds an index.html that references old hashed chunk names
// (e.g. /assets/index-Cp6bYAL2.js). Navigating to a lazy route then fails with
// "Failed to fetch dynamically imported module". Vite emits `vite:preloadError`
// for exactly this — reload once to pull the fresh manifest + chunks. A 10s
// time-guard prevents a reload loop when the asset is genuinely unreachable.
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'appbase:preload-reload-at';
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 10_000) return; // already reloaded recently — stop looping
  sessionStorage.setItem(KEY, String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered "fresh" (won't refetch)
      // Reduced from 5 minutes to 1 minute to prevent stale data issues
      staleTime: 1000 * 60, // 1 minute

      // How long inactive data stays in cache before garbage collection
      gcTime: 1000 * 60 * 5, // 5 minutes

      // Refetch when component mounts if data is stale
      refetchOnMount: true,

      // Refetch when window regains focus if data is stale
      refetchOnWindowFocus: true,

      // Number of retry attempts on failure
      retry: 1,
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
    },
  },
});

// Only load Vercel Web Analytics on the real production deployment. On localhost,
// `vite preview`, CI, and any non-prod host the `/_vercel/insights/script.js`
// endpoint does not exist (it is injected by Vercel's edge), so loading it there
// 404s — which pollutes the console and trips console-clean E2E assertions. The
// real www.thekopistudio.com deploy is unaffected.
//
// Host updated 2026-08-13: this pinned `prospect-profiler-app.vercel.app`, which
// now 404s — the Vercel project was replaced by `thekopistudio`, serving
// www.thekopistudio.com (the apex 308s to www). Analytics had therefore been
// silently OFF on the only host that is actually production. Matching the apex
// and its subdomains keeps it working if the redirect is ever reversed, while
// still excluding localhost, previews (*.vercel.app) and CI.
const PROD_DOMAIN = 'thekopistudio.com';
const isProdHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === PROD_DOMAIN ||
    window.location.hostname.endsWith(`.${PROD_DOMAIN}`));

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <App />
      {isProdHost && <Analytics />}
    </QueryClientProvider>
  </AuthProvider>
);
