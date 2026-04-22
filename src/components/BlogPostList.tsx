"use client";

import { Link } from "vocs";

type BlogPost = {
  date: string;
  description: React.ReactNode;
  title: string;
  to: string;
};

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        alignSelf: "center",
        color: "var(--vocs-text-color-muted)",
        flexShrink: 0,
      }}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function BlogPostRow({ date, description, title, to }: BlogPost) {
  return (
    <Link
      to={to}
      className="blog-post-row info-card-link no-underline!"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "0.55rem",
        padding: "0.65rem 0.85rem",
        borderRadius: 8,
        border: "1px solid var(--vocs-border-color-primary)",
        background: "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))",
        color: "var(--vocs-text-color-heading)",
        textDecoration: "none",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--vocs-text-color-muted)",
            marginBottom: "0.1rem",
          }}
        >
          {date}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            marginBottom: "0.1rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--vocs-text-color-muted)",
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      </div>
      <ArrowIcon />
    </Link>
  );
}

export function BlogPostList({ posts }: { posts: BlogPost[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {posts.map((post) => (
        <BlogPostRow key={post.to} {...post} />
      ))}
    </div>
  );
}
