/** Each playground's code panes, highlighted at build time (shared/prerender-code.ts). */
declare module "virtual:charge-code" {
  const code: import("./code.js").Code;
  export default code;
}
declare module "virtual:zones-code" {
  const code: import("./code.js").Code;
  export default code;
}
declare module "virtual:discovery-code" {
  const code: import("./code.js").Code;
  export default code;
}

/** The colors the panes' tokens use, as .t0, .t1… classes. */
declare module "virtual:charge-code-theme.css" {}
declare module "virtual:discovery-code-theme.css" {}
declare module "virtual:zones-code-theme.css" {}
