import { readFile, writeFile } from "node:fs/promises";

const CONFIG_PATH = new URL("../wrangler.jsonc", import.meta.url);
const DEPLOY_CONFIG_PATH = new URL("../wrangler.deploy.jsonc", import.meta.url);
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const DRY_RUN_PLACEHOLDER_ID = "00000000000000000000000000000000";
const dryRun = process.argv.includes("--dry-run");

const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
const accountId = config.account_id;
const envAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!accountId) {
  throw new Error("wrangler.jsonc must include the production account_id");
}

if (envAccountId && envAccountId !== accountId) {
  throw new Error(
    `CLOUDFLARE_ACCOUNT_ID (${envAccountId}) does not match wrangler.jsonc account_id (${accountId})`,
  );
}

const namespace = config.kv_namespaces?.find(
  (binding) => binding.binding === "MPP_CATALOG_CACHE",
);

if (!namespace) {
  throw new Error("wrangler.jsonc must include MPP_CATALOG_CACHE");
}

const namespaceId =
  process.env.MPP_CATALOG_CACHE_KV_NAMESPACE_ID ||
  (dryRun && !process.env.CLOUDFLARE_API_TOKEN
    ? DRY_RUN_PLACEHOLDER_ID
    : await ensureKvNamespace(accountId, namespace.binding));

if (!/^[0-9a-f]{32}$/i.test(namespaceId)) {
  throw new Error(`Invalid KV namespace id for ${namespace.binding}`);
}

namespace.id = namespaceId;

await writeFile(DEPLOY_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);

console.log(`Prepared ${DEPLOY_CONFIG_PATH.pathname}`);
console.log(`Using KV namespace ${namespace.binding} (${namespaceId})`);

async function ensureKvNamespace(accountId, title) {
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!token) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is required to resolve or create MPP_CATALOG_CACHE",
    );
  }

  const existing = await listKvNamespaces(accountId, token);
  const match = existing.find((item) => item.title === title);
  if (match) return match.id;

  const created = await cloudflareRequest({
    accountId,
    token,
    method: "POST",
    path: "/storage/kv/namespaces",
    body: { title },
  });

  return created.result.id;
}

async function listKvNamespaces(accountId, token) {
  const namespaces = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await cloudflareRequest({
      accountId,
      token,
      method: "GET",
      path: "/storage/kv/namespaces",
      query: { page, per_page: 100 },
    });
    namespaces.push(...response.result);
    totalPages = response.result_info?.total_pages || 1;
    page += 1;
  } while (page <= totalPages);

  return namespaces;
}

async function cloudflareRequest({
  accountId,
  token,
  method,
  path,
  query,
  body,
}) {
  const url = new URL(`${CLOUDFLARE_API_BASE}/accounts/${accountId}${path}`);
  for (const [key, value] of Object.entries(query || {})) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();

  if (!payload.success) {
    const errors = payload.errors
      ?.map((error) => `${error.code}: ${error.message}`)
      .join("; ");
    throw new Error(
      `Cloudflare API request failed: ${errors || response.status}`,
    );
  }

  return payload.result !== undefined
    ? { result: payload.result, result_info: payload.result_info }
    : payload;
}
