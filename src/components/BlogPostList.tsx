"use client";

import { Link } from "vocs";
import { BLOG_POSTS, type BlogPost, formatBlogPostDate } from "../data/blog";

function BlogPostRow({ date, description, title, to }: BlogPost) {
  return (
    <Link className="blog-post-row" to={to}>
      <div className="blog-post-row-title">
        <h2>{title}</h2>
        <p>{formatBlogPostDate(date)}</p>
      </div>
      <div className="blog-post-row-description">{description}</div>
      <span aria-hidden="true" className="blog-post-row-arrow">
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="1.25"
          viewBox="0 0 16 16"
          width="16"
        >
          <line x1="4.5" x2="11.5" y1="11.5" y2="4.5" />
          <polyline points="5.5 4.5 11.5 4.5 11.5 10.5" />
        </svg>
      </span>
    </Link>
  );
}

export function BlogPostList({
  posts = BLOG_POSTS,
}: {
  posts?: readonly BlogPost[];
}) {
  return (
    <div className="blog-post-list">
      {posts.map((post) => (
        <BlogPostRow key={post.to} {...post} />
      ))}
    </div>
  );
}
