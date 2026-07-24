"use client";

import { Link } from "vocs";

type BlogPost = {
  date: string;
  description: React.ReactNode;
  title: string;
  to: string;
};

function formatDate(date: string) {
  return date.replace(/^[A-Za-z]+,\s*/, "");
}

function BlogPostRow({ date, description, title, to }: BlogPost) {
  return (
    <Link className="blog-post-row" to={to}>
      <div className="blog-post-row-title">
        <h2>{title}</h2>
        <p>{formatDate(date)}</p>
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

export function BlogPostList({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="blog-post-list">
      {posts.map((post) => (
        <BlogPostRow key={post.to} {...post} />
      ))}
    </div>
  );
}
