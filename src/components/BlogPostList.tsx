"use client";

import { Link } from "vocs";

type BlogPost = {
  date: string;
  description: React.ReactNode;
  title: string;
  to: string;
};

function BlogPostRow({ date, description, title, to }: BlogPost) {
  return (
    <Link className="blog-post-row" to={to}>
      <div className="blog-post-row-title">
        <h2>{title}</h2>
        <p>{date}</p>
      </div>
      <div className="blog-post-row-description">{description}</div>
      <span aria-hidden="true" className="blog-post-row-arrow">
        ↗
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
