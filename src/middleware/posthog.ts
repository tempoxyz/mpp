import type { MiddlewareHandler } from "vocs/server";

const CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "anthropic-ai",
  "ClaudeBot",
  "claude-web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "Amazonbot",
  "Applebot",
  "Applebot-Extended",
  "FacebookBot",
  "meta-externalagent",
  "LinkedInBot",
  "Bytespider",
  "DuckAssistBot",
  "cohere-ai",
  "AI2Bot",
  "CCBot",
  "Diffbot",
  "omgili",
  "Timpibot",
  "YouBot",
  "MistralAI-User",
  "GoogleAgent-Mariner",
];

export default function posthogCrawlerAnalytics(): MiddlewareHandler {
  return async (c, next) => {
    const userAgent = c.req.header("user-agent") || "";
    const crawlerName = CRAWLERS.find((crawler) => userAgent.includes(crawler));
    if (!crawlerName) return next();

    const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
    if (!posthogKey) return next();

    const posthogHost =
      import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
    const url = new URL(c.req.url);
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();

    const event = {
      api_key: posthogKey,
      event: "crawler_pageview",
      distinct_id: `crawler_${crawlerName}`,
      properties: {
        crawler_name: crawlerName,
        user_agent: userAgent,
        path: url.pathname,
        site: "mpp",
        tempo_app_id: "mpp",
        $current_url: c.req.url,
        $host: url.hostname,
        $ip: ip,
      },
    };

    fetch(`${posthogHost}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {});

    await next();
  };
}
