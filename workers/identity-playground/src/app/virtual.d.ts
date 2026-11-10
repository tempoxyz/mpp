/** The code panes' first state, highlighted at build time (vite.config.ts, prerenderCode). */
declare module "virtual:prerendered-code" {
  const panes: Record<string, { html: string; source: string }>;
  export default panes;
}
