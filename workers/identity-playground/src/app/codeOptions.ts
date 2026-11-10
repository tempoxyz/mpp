// The code panes' @pierre/diffs options, shared by CodeView.tsx and the build-time prerender in
// vite.config.ts: prerendered HTML only hydrates without a re-render when both use the same ones.
export const codeOptions = {
  disableFileHeader: true,
  disableLineNumbers: true,
  overflow: "wrap",
  theme: { dark: "github-dark-dimmed", light: "github-light" },
  themeType: "dark",
} as const;
