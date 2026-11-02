// The page is bundled before it is packaged. `tinyjs build` runs this with no
// argument and ships .page/; `tinyjs dev` runs it with --serve, which answers on
// the port tinyjs.json names and rebuilds the bundle from memory as the page is
// edited. Nothing here is committed: .page/ is a build artifact.

import { cp, rm } from "node:fs/promises";

import { build, context } from "esbuild";

const PAGE = "src/frontend";
// The theme is the shared library's: its tokens, its two faces and their files.
const THEME = "../../libs/theme";
const OUT = ".page";
const PORT = 5199;

// What the page loads beside its own script travels as it is.
const BESIDE = ["index.html", "style.css"];

// The files the page reads beside its script, placed again on every build so a
// dev server never serves the theme of a minute ago.
async function place() {
  for (const file of BESIDE) {
    await cp(`${PAGE}/${file}`, `${OUT}/${file}`, { recursive: true });
  }
  await cp(`${THEME}/theme.css`, `${OUT}/theme.css`);
  await cp(`${THEME}/fonts`, `${OUT}/fonts`, { recursive: true });
}

const options = {
  entryPoints: [`${PAGE}/app.js`],
  bundle: true,
  format: "esm",
  target: "es2020",
  outfile: `${OUT}/app.js`,
  plugins: [
    { name: "beside", setup: (bundler) => bundler.onEnd(() => place()) },
  ],
};

if (process.argv.includes("--serve")) {
  // Served from memory: the bundle is the one in this process, and the browser
  // is never given a built file it could mistake for source.
  await rm(OUT, { recursive: true, force: true });
  await place();
  const served = await context({
    ...options,
    write: false,
    minify: false,
  });
  await served.watch();
  await served.serve({ servedir: OUT, host: "127.0.0.1", port: PORT });
  console.log(`the page is served at http://127.0.0.1:${PORT}`);
} else {
  await rm(OUT, { recursive: true, force: true });
  await build({ ...options, minify: true });
  console.log(`the page is in ${OUT}/`);
}
