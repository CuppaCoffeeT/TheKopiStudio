import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

const HANDOFFS_ROOT = path.resolve(
  __dirname,
  "docs/99-refactor/_system/design/handoffs",
);

// W23 — serve docs/99-refactor/_system/design/handoffs/** read-only at
// /docs-assets/handoffs/** + expose a manifest index at /docs-assets/handoffs-index.
// Dev-only middleware (not registered in production builds). Used by /design-import staging.
function docsAssetsPlugin() {
  return {
    name: "docs-assets-handoffs",
    configureServer(server: { middlewares: { use: (path: string, handler: (req: { url?: string }, res: { statusCode?: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }, next?: () => void) => void) => void } }) {
      server.middlewares.use("/docs-assets/handoffs-index", (_req, res) => {
        try {
          if (!fs.existsSync(HANDOFFS_ROOT)) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ snapshots: [] }));
            return;
          }
          const entries = fs
            .readdirSync(HANDOFFS_ROOT, { withFileTypes: true })
            .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
            .sort((a, b) => b.name.localeCompare(a.name));

          const snapshots = entries.map((entry) => {
            const folder = entry.name;
            const manifestPath = path.join(HANDOFFS_ROOT, folder, "MANIFEST.json");
            const readmePath = path.join(HANDOFFS_ROOT, folder, "README.md");
            let manifest: unknown = null;
            let hasReadme = false;
            try {
              if (fs.existsSync(manifestPath)) {
                manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
              }
              hasReadme = fs.existsSync(readmePath);
            } catch {
              manifest = null;
            }
            return { folder, manifest, hasReadme };
          });

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ snapshots }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      server.middlewares.use("/docs-assets/handoffs/", (req, res, next) => {
        const urlPath = decodeURIComponent((req.url ?? "").split("?")[0]);
        if (!urlPath || urlPath === "/") {
          next?.();
          return;
        }
        const normalized = path.normalize(urlPath).replace(/^\/+/, "");
        const fullPath = path.join(HANDOFFS_ROOT, normalized);
        if (!fullPath.startsWith(HANDOFFS_ROOT)) {
          res.statusCode = 403;
          res.end("forbidden");
          return;
        }
        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
          next?.();
          return;
        }
        const ext = path.extname(fullPath).toLowerCase();
        const mime: Record<string, string> = {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".mjs": "text/javascript; charset=utf-8",
          ".jsx": "text/plain; charset=utf-8",
          ".md": "text/plain; charset=utf-8",
          ".json": "application/json; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
        };
        res.setHeader("Content-Type", mime[ext] ?? "application/octet-stream");
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(fullPath).pipe(res as unknown as NodeJS.WritableStream);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [
        path.resolve(__dirname, "."),
        path.resolve(__dirname, "docs/99-refactor/_system/design"),
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    mode === 'development' && docsAssetsPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libs into named chunks so they stay out of the
        // main entry bundle. Function form: only packages actually present in
        // node_modules match, so adding/removing a dep needs no config change.
        manualChunks(id: string) {
          // Rollup's shared CommonJS interop helpers (getDefaultExportFromCjs,
          // getAugmentedNamespace) live in one synthetic module. Both react
          // (CJS) and chart-stack CJS deps (lodash, clsx) need it. If Rollup
          // parks it in the `charts` chunk, `react-vendor` must import it back —
          // forming a chunk-level cycle. recharts calls React.forwardRef at
          // module scope, so when `charts` evaluates before `react-vendor` has
          // initialised, React is in the TDZ: "Cannot access '_' before
          // initialization" → root never mounts → blank production page.
          // Pin the helper to react-vendor so the only cross-chunk edge is
          // charts → react-vendor (one-way); react-vendor stays cycle-free.
          if (id.includes("commonjsHelpers")) {
            return "react-vendor";
          }
          if (id.includes("node_modules")) {
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router-dom/") ||
              id.includes("node_modules/react-router/") ||
              id.includes("node_modules/@remix-run/router/")
            ) {
              return "react-vendor";
            }
            if (id.includes("node_modules/@supabase/")) {
              return "supabase";
            }
            if (
              id.includes("node_modules/@tanstack/react-query") ||
              id.includes("node_modules/@tanstack/query-core")
            ) {
              return "query";
            }
            if (
              id.includes("node_modules/recharts/") ||
              id.includes("node_modules/@tremor/react") ||
              id.includes("node_modules/d3-") ||
              id.includes("node_modules/victory-vendor/")
            ) {
              return "charts";
            }
            if (
              id.includes("node_modules/leaflet/") ||
              id.includes("node_modules/react-leaflet/") ||
              id.includes("node_modules/@react-leaflet/") ||
              id.includes("node_modules/@turf/")
            ) {
              return "map";
            }
            if (
              id.includes("node_modules/jspdf/") ||
              id.includes("node_modules/pdf-lib/") ||
              id.includes("node_modules/html2canvas/")
            ) {
              return "pdf";
            }
            if (
              id.includes("node_modules/exceljs/") ||
              id.includes("node_modules/xlsx/")
            ) {
              return "excel";
            }
            if (
              id.includes("node_modules/@tiptap/") ||
              id.includes("node_modules/prosemirror-") ||
              id.includes("node_modules/dompurify/")
            ) {
              return "editor";
            }
          }
        },
      },
    },
  },
}));
