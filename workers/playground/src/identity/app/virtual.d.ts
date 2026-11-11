/** The code panes, highlighted and diffed at build time (vite.config.ts, prerenderCode). */
declare module "virtual:identity-code" {
  const code: import("./code.js").Code;
  export default code;
}

/** The colors the panes' tokens use, as .t0, .t1… classes. */
declare module "virtual:identity-code-theme.css" {}
