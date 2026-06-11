
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';

// W08 Phase 2 — fonts loaded app-wide.
// Roboto 400/500/700 = body + UI · Geist Mono 400/500/700 = tabular + code.
// Geist Pixel Square is self-hosted via @font-face in index.css.
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/geist-mono/500.css';
import '@fontsource/geist-mono/700.css';

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
// real prospect-profiler-app.vercel.app deploy is unaffected.
const isProdHost =
  typeof window !== 'undefined' && window.location.hostname === 'prospect-profiler-app.vercel.app';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <App />
      {isProdHost && <Analytics />}
    </QueryClientProvider>
  </AuthProvider>
);
