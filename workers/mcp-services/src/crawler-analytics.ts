import type { WorkerEnv } from "./types.js";

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

export function trackCrawlerPageview(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext,
): void {
  const userAgent = request.headers.get("user-agent") ?? "";
  const crawlerName = CRAWLERS.find((crawler) => userAgent.includes(crawler));
  const posthogKey = env.POSTHOG_KEY || env.VITE_POSTHOG_KEY;
  if (!crawlerName || !posthogKey) return;

  const url = new URL(request.url);
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  const posthogHost =
    env.POSTHOG_HOST || env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

  const event = {
    api_key: posthogKey,
    event: "crawler_pageview",
    distinct_id: `crawler_${crawlerName}`,
    properties: {
      crawler_name: crawlerName,
      user_agent: userAgent,
      path: url.pathname,
      site: "mpp-services-mcp",
      tempo_app_id: "mpp-services-mcp",
      $current_url: request.url,
      $host: url.hostname,
      $ip: ip,
    },
  };

  ctx.waitUntil(
    fetch(`${posthogHost}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => undefined),
  );
}
