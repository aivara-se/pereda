/**
 * GitHub Pages serves the site. A project page is served under the repository's
 * name and a custom domain at its root, so the path comes from the deploy; the
 * CNAME the operator points is the one line that empties it
 * (docs/adrs/035-the-web-app-is-a-static-sveltekit-site.md).
 */

import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const base = process.env.PEREDA_BASE ?? "";

export default defineConfig({
  plugins: [
    sveltekit({
      paths: { base },
      adapter: adapter({
        pages: "build",
        assets: "build",
        precompress: false,
        fallback: "404.html",
      }),
    }),
  ],

  server: { fs: { allow: ["../.."] } },

  optimizeDeps: { exclude: ["@sqlite.org/sqlite-wasm"] },
});
