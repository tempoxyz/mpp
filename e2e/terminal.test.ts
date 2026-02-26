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
  // Allow React to process state updates and re-attach effects
  await page.waitForTimeout(50);
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
    const response = await page.goto(`http://localhost:${port}`);
    console.log("page status:", response?.status());

    // Wait for initial render
    await page.waitForTimeout(2_000);
    const html = await page.content();
    console.log("page html length:", html.length);
    console.log("page html preview:", html.slice(0, 2000));
    const errors = await page.evaluate(
      () => (globalThis as any).__e2e_errors ?? [],
    );
    console.log("page errors:", errors);

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

    await playwrightExpect(page.getByText("Chat with AI")).toBeVisible();
    await playwrightExpect(page.getByText("Generate image")).toBeVisible();
    await playwrightExpect(page.getByText("Search the web")).toBeVisible();
    await playwrightExpect(page.getByText("Summarize article")).toBeVisible();

    await page.close();
  });

  it.concurrent('selects "Chat with AI" and shows payment channel steps', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "Enter");

    // Now we need to enter a prompt
    await playwrightExpect(page.getByText("Enter prompt:")).toBeVisible({
      timeout: 5_000,
    });
    await page.keyboard.type("what are micropayments?");
    await page.keyboard.press("Enter");

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

  it.concurrent('selects "Generate image" via arrow key and shows charge steps', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(page.getByText("Enter prompt:")).toBeVisible({
      timeout: 5_000,
    });
    await page.keyboard.type("a neon cityscape");
    await page.keyboard.press("Enter");

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

  it.concurrent('selects "Summarize article" and enters a URL', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
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

    await page.close();
  });

  it.concurrent("quits after a run and shows summary", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    // Enter prompt for Generate image
    await playwrightExpect(page.getByText("Enter prompt:")).toBeVisible({
      timeout: 5_000,
    });
    await page.keyboard.type("test image");
    await page.keyboard.press("Enter");

    // First run should say "Creating wallet"
    await playwrightExpect(
      page.getByText("Creating wallet", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("Quit")).toBeVisible({
      timeout: 15_000,
    });

    // Second run: select "Generate image" again
    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(
      page.getByText("Enter prompt:", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
    await page.keyboard.type("another test");
    await page.keyboard.press("Enter");

    // Second run should say "Using wallet" (not "Creating")
    await playwrightExpect(
      page.getByText("Using wallet", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    // Wait for the second run to fully complete (wizard ready for input)
    await page.waitForSelector("[data-wizard-ready]", { timeout: 20_000 });

    // Navigate to Quit (5 options: Chat with AI, Generate image, Search the web, Summarize article, Quit)
    await pressKey(page, "ArrowDown"); // → Generate image (1)
    await pressKey(page, "ArrowDown"); // → Search the web (2)
    await pressKey(page, "ArrowDown"); // → Summarize article (3)
    await pressKey(page, "ArrowDown"); // → Quit (4)
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
    await playwrightExpect(page.getByText("Chat with AI")).toBeVisible();

    await page.close();
  });
});

describe("terminal (classic mode)", () => {
  it.concurrent("shows classic wizard options with ?mode=classic", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/?mode=classic`);
    await waitForWizard(page);

    await playwrightExpect(page.getByText("Write poem")).toBeVisible();
    await playwrightExpect(page.getByText("Create ASCII art")).toBeVisible();
    await playwrightExpect(page.getByText("Lookup company")).toBeVisible();
    await playwrightExpect(page.getByText("Chat with AI")).toBeHidden();

    await page.close();
  });

  it.concurrent('selects "Write poem" and shows payment channel steps', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/?mode=classic`);
    await waitForWizard(page);

    await pressKey(page, "Enter");

    await playwrightExpect(page.getByText("Enter prompt:")).toBeVisible({
      timeout: 5_000,
    });
    await page.keyboard.type("roses are red");
    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("Creating wallet", { exact: false }),
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

    await page.close();
  });

  it.concurrent('selects "Create ASCII art" and shows charge steps', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/?mode=classic`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(page.getByText("Enter prompt:")).toBeVisible({
      timeout: 5_000,
    });
    await page.keyboard.type("a cat");
    await page.keyboard.press("Enter");

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

  it.concurrent('selects "Lookup company" and shows Stripe steps', async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/?mode=classic`);
    await waitForWizard(page);

    await pressKey(page, "ArrowDown");
    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(page.getByText("Enter URL:")).toBeVisible({
      timeout: 5_000,
    });

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

    await page.close();
  });
});
