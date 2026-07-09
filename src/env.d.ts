declare const __COMMIT_SHA__: string;
declare const __COMMIT_TIMESTAMP__: string;

declare module "*.svg?raw" {
  const content: string;
  export default content;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*.json?raw" {
  const content: string;
  export default content;
}
