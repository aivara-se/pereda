// The site is one app in the browser: no route is rendered for a request, every
// route is a page the build writes, and a path ending in a slash is the form
// GitHub Pages answers with that page (docs/adrs/035).

export const ssr = false;
export const prerender = true;
export const trailingSlash = "always";
