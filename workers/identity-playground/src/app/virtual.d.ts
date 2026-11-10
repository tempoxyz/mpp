/** The code panes' first state, highlighted at build time (vite.config.ts, prerenderCode). */
declare module "virtual:prerendered-code" {
  const panes: Record<string, { html: string; source: string }>;
  export default panes;
}

declare module "virtual:prerendered-diffs" {
  /** @pierre/diffs' own prerendered HTML for each pane's first file, for <File prerenderedHTML>. */
  const panes: Record<string, { html: string; source: string }>;
  export default panes;
}
