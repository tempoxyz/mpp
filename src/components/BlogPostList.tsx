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
      style={{ color: "var(--vocs-color_text3)", flexShrink: 0 }}
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
      className="no-underline!"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "1.25rem 1.5rem",
        borderRadius: 12,
        border: "1px solid var(--vocs-color_border)",
        textDecoration: "none",
        transition: "border-color 0.15s, background 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--vocs-color_border2)";
        e.currentTarget.style.background =
          "light-dark(rgba(0,0,0,0.02), rgba(255,255,255,0.03))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--vocs-color_border)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--vocs-color_text3)",
            marginBottom: 4,
          }}
        >
          {date}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--vocs-color_text)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--vocs-color_text3)",
            marginTop: 4,
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {posts.map((post) => (
        <BlogPostRow key={post.to} {...post} />
      ))}
    </div>
  );
}
