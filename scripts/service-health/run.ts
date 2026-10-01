import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { services } from "../../schemas/services.ts";
import { checkServices } from "./check.ts";
import { checkMpp, checkUrls } from "./checks.ts";
import { type Issue, syncIssue } from "./issues.ts";
import { renderReport } from "./report.ts";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--issue" && !/^--service=.+$/.test(arg)))
  throw new Error("Usage: pnpm check:services [--service=<id>] [--issue]");
if (args.filter((arg) => arg.startsWith("--service=")).length > 1)
  throw new Error("Specify only one service");
const selected = args
  .find((arg) => arg.startsWith("--service="))
  ?.slice("--service=".length);
const catalog = selected
  ? services.filter((service) => service.id === selected)
  : services;
if (!catalog.length) throw new Error("No matching services");
const publish = args.includes("--issue");
if (publish && selected)
  throw new Error("Partial runs cannot update the tracking issue");
const repository = process.env.GITHUB_REPOSITORY;
if (publish && (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)))
  throw new Error("GITHUB_REPOSITORY is required");
const results = await checkServices(catalog, [checkUrls, checkMpp]);
const checkedAt = new Date().toISOString();
const outputDirectory = mkdtempSync(
  join(process.env.RUNNER_TEMP ?? tmpdir(), "service-health-"),
);
const runUrl =
  repository && process.env.GITHUB_RUN_ID
    ? `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : `Local run; see ${join(outputDirectory, "results.json")}`;
const body = renderReport(results, checkedAt, runUrl);
writeFileSync(
  join(outputDirectory, "results.json"),
  JSON.stringify(
    { checkedAt, results, revision: process.env.GITHUB_SHA },
    null,
    2,
  ),
);
writeFileSync(join(outputDirectory, "report.md"), body);
if (process.env.GITHUB_OUTPUT)
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `report-directory=${outputDirectory}\n`,
  );
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
console.log(body);

if (publish) {
  const api = (
    path: string,
    method = "GET",
    input?: object,
    paginate = false,
  ): string =>
    execFileSync(
      "gh",
      [
        "api",
        path,
        "--method",
        method,
        ...(paginate ? ["--paginate", "--slurp"] : []),
        ...(input ? ["--input", "-"] : []),
      ],
      {
        encoding: "utf8",
        input: input ? JSON.stringify(input) : undefined,
        maxBuffer: 16 * 1024 * 1024,
        timeout: 60_000,
      },
    );
  const path = `repos/${repository}/issues`;
  await syncIssue(
    {
      async list() {
        return (
          JSON.parse(
            api(
              `${path}?state=all&creator=github-actions%5Bbot%5D&per_page=100`,
              "GET",
              undefined,
              true,
            ),
          ) as Issue[][]
        ).flat();
      },
      async create(body) {
        api(path, "POST", {
          body,
          title: "Service catalog health: confirmed failures",
        });
      },
      async update(number, body, state) {
        api(`${path}/${number}`, "PATCH", { body, state });
      },
    },
    results,
    body,
  );
}
