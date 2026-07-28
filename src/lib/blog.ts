export type BlogPost = {
  date: string;
  description: string;
  publishedAt: string;
  title: string;
  to: string;
};

export function formatBlogPostDate(date: string): string {
  return date.replace(/^[A-Za-z]+,\s*/, "");
}

export function formatBlogDate(publishedAt: string): string {
  // Parse and format in UTC so a date-only value never shifts for readers west
  // of Greenwich or for builds running in a different system timezone.
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${publishedAt}T00:00:00Z`));
}
