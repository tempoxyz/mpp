import type { ReactNode } from "react";
import { BlogPostChrome } from "../../components/BlogPostChrome.js";

export default function BlogWrapper({ children }: { children: ReactNode }) {
  return <BlogPostChrome>{children}</BlogPostChrome>;
}
