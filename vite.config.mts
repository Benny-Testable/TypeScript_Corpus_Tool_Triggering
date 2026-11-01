import { resolve } from "node:path";
import { defineConfig } from "vite";

// Server-side bundle: one CommonJS file, with runtime dependencies left external
// so the installed package versions stay visible to dependency tooling.
export default defineConfig({
  build: {
    ssr: resolve(__dirname, "src/index.ts"),
    outDir: "build",
    target: "node22",
    minify: false,
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: [/^node:/, "lodash/cloneDeep", "minimist", "axios", "node-fetch", "qs", "semver", "@opentelemetry/api"],
      output: { entryFileNames: "bundle.cjs", format: "cjs", exports: "named" },
    },
  },
});
