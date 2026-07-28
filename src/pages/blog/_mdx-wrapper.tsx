import type { ReactNode } from "react";
import { BlogPostLayout } from "../../components/BlogPostLayout.js";

export default function BlogWrapper({ children }: { children: ReactNode }) {
  return <BlogPostLayout>{children}</BlogPostLayout>;
}
