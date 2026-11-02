import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

// GitHub Pages serves the site. A project page is served under the repository's
// name and a custom domain at its root, so the path comes from the deploy; the
// CNAME the operator points is the one line that empties it
// (docs/adrs/035-the-web-app-is-a-static-sveltekit-site.md).
const base = process.env.PEREDA_BASE ?? "";

export default defineConfig({
  plugins: [
    sveltekit({
      paths: { base },
      // Every route is a page the build writes: no request is rendered.
      adapter: adapter({ pages: "build", assets: "build", precompress: false }),
    }),
  ],

  // The notes libraries and the theme are the workspace's, one directory up.
  server: { fs: { allow: ["../.."] } },

  // SQLite's WebAssembly build finds its own file, so it is not pre-bundled.
  optimizeDeps: { exclude: ["@sqlite.org/sqlite-wasm"] },
});
