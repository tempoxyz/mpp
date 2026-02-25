import { expect as playwrightExpect } from "@playwright/test";
import type { Page } from "playwright";
import { type Browser, chromium } from "playwright";
import type { ViteDevServer } from "vite";
import { createServer } from "vite";
import { afterAll, beforeAll, describe, it } from "vitest";

let server: ViteDevServer;
let browser: Browser;
let port: number;

beforeAll(async () => {
  server = await createServer({
    server: { port: 0 },
    logLevel: "error",
  });
  await server.listen();
  const address = server.httpServer?.address();
  port = typeof address === "object" && address ? address.port : 5173;
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

function newPage() {
  return browser.newPage({ viewport: { width: 1024, height: 768 } });
}

// Vocs RSC hydration means CDP keyboard events may not reach window listeners.
// Dispatch via evaluate to ensure the event is received.
async function pressKey(page: Page, key: string) {
  await page.evaluate(
    (k) =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: k, bubbles: true }),
      ),
    key,
  );
}

async function waitForWizard(page: Page) {
  await playwrightExpect(
    page.getByText("What would you like to do?"),
  ).toBeVisible({ timeout: 10_000 });
  // Wait for React hydration to attach keyboard handlers
  await page.waitForSelector("[data-wizard-ready]", { timeout: 5_000 });
}

describe("terminal", () => {
  it.concurrent("renders the terminal window", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);

    await playwrightExpect(page.locator(".rounded-full").first()).toBeVisible();
    await playwrightExpect(page.getByText("Last login:")).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });

  it.concurrent("types out lines and shows quickstart output", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);

    await playwrightExpect(
      page.getByText("Read the docs:", { exact: false }),
    ).toBeVisible({ timeout: 15_000 });

    await playwrightExpect(page.getByText("mpp.dev/llms.txt")).toBeVisible();
    await playwrightExpect(page.getByText("mpp.dev/services")).toBeVisible();
    await playwrightExpect(page.getByText("mpp.dev/overview")).toBeVisible();

    await page.close();
  });

  it.concurrent("shows the wizard after typewriter finishes", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);

    await waitForWizard(page);

    await playwrightExpect(page.getByText("Write poem")).toBeVisible();
    await playwrightExpect(page.getByText("Create ASCII art")).toBeVisible();
    await playwrightExpect(page.getByText("Lookup company")).toBeVisible();

    await page.close();
  });

  it.concurrent('selects "Write poem" and shows payment channel steps', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "Enter");

    await playwrightExpect(
      page.getByText("Creating wallet", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(
      page.getByText("Funding wallet", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("402 Payment Required")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("Opening payment channel"),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(
      page.getByText("tokens streamed", { exact: false }),
    ).toBeVisible({ timeout: 20_000 });

    await playwrightExpect(
      page.getByText("Closing payment channel"),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(
      page.getByText("What would you like to do?").last(),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(page.getByText("Quit")).toBeVisible();

    await page.close();
  });

  it.concurrent('selects "Create ASCII art" via arrow key and shows charge steps', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(
      page.getByText("Creating wallet", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("402 Payment Required")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(page.getByText("Fulfilling payment")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(page.getByText("200 OK")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("What would you like to do?").last(),
    ).toBeVisible({ timeout: 5_000 });

    await page.close();
  });

  it.concurrent('selects "Lookup company" and enters a URL', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(page.getByText("Enter URL:")).toBeVisible({
      timeout: 5_000,
    });

    // The URL input is a focused BlockCursorInput — type into it via the page
    await page.keyboard.type("stripe.com");
    await page.keyboard.press("Enter");

    await playwrightExpect(page.getByText("402 Payment Required")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("Card number:", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await page.keyboard.type("4242424242424242");
    await page.keyboard.press("Enter");
    await page.keyboard.type("12/34");
    await page.keyboard.press("Enter");
    await page.keyboard.type("123");
    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("Creating PaymentIntent"),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("200 OK")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("Stripe", { exact: false }).last(),
    ).toBeVisible({ timeout: 5_000 });

    await page.close();
  });

  it.concurrent("quits after a run and shows summary", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(page.getByText("Quit")).toBeVisible({
      timeout: 15_000,
    });

    await pressKey(page, "ArrowDown");
    await pressKey(page, "ArrowDown");
    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(
      page.getByText("Total", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(
      page.getByText("Balance", { exact: false }),
    ).toBeVisible();
    await playwrightExpect(
      page.getByText("Address", { exact: false }),
    ).toBeVisible();

    // Press Enter to restart the wizard
    await pressKey(page, "Enter");

    await page.waitForSelector("[data-wizard-ready]", { timeout: 5_000 });
    await playwrightExpect(
      page.getByText("What would you like to do?").last(),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(page.getByText("Write poem")).toBeVisible();

    await page.close();
  });
});
