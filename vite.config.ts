import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// GitHub Pages serves the site from /<repo>/, so the production build needs that prefix.
// Runtime asset paths go through src/asset-url.ts, which reads the same value.
// `vite preview` runs with command === "serve", so it needs isPreview to match the build.
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/ai-expo-mvp/" : "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id))
            return "react-vendor";
          if (id.includes("/node_modules/three/")) return "three-core";
          if (id.includes("/node_modules/@react-three/")) return "three-react";
        },
      },
    },
  },
}));
