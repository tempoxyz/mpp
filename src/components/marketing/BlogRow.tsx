import { Link } from "waku";
import type { BlogPost } from "../../lib/blog";
import { formatBlogPostDate } from "../../lib/blog";
import { Icon } from "./Icon";

export function BlogRow({ post }: { post: BlogPost }) {
  return (
    <Link
      className="group flex items-start gap-4 border-b border-border px-4 py-5 text-offwhite no-underline transition-colors hover:bg-white/[0.02] md:py-6"
      to={post.to}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1 md:w-[200px] md:flex-none">
        <p className="font-sans text-xl font-normal leading-[1.1] tracking-normal !text-offwhite">
          {post.title}
        </p>
        <time className="mt-px font-mono text-sm uppercase leading-4 tracking-normal !text-white/60 transition-colors group-hover:!text-offwhite">
          {formatBlogPostDate(post.date)}
        </time>
      </div>
      <p className="hidden flex-1 font-sans text-lg leading-[1.2] tracking-normal !text-white/60 transition-colors group-hover:!text-offwhite md:block">
        {post.description}
      </p>
      <span className="flex shrink-0 items-center justify-center border border-border bg-[#101010] p-1.5 text-secondary transition-colors group-hover:text-offwhite">
        <Icon name="arrow-linkout" />
      </span>
    </Link>
  );
}
