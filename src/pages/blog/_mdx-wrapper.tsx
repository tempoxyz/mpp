import type { ReactNode } from "react";
import { Layout } from "vocs";
import { BlogPostLayout } from "../../components/BlogPostLayout.js";

export default function BlogWrapper({ children }: { children: ReactNode }) {
  return (
    <Layout>
      <BlogPostLayout>{children}</BlogPostLayout>
    </Layout>
  );
}
