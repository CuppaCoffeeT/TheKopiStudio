import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), tailwindcss()],
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
          // getAugmentedNamespace) live in one synthetic module that react
          // (CJS) and other CJS vendor deps share. If Rollup parks it in a
          // vendor chunk, `react-vendor` must import it back — a chunk-level
          // cycle that once put React in the TDZ ("Cannot access '_' before
          // initialization") and blanked the production page (seen with the
          // since-removed recharts `charts` chunk). Pin it to react-vendor so
          // every cross-chunk edge points into react-vendor, never out.
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
});
