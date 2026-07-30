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

declare module "*?url" {
  const url: string;
  export default url;
}

declare module "virtual:vocs/group-icons.css?url" {
  const url: string | undefined;
  export default url;
}

declare module "virtual:vocs/user-styles" {
  const url: string | undefined;
  export default url;
}
