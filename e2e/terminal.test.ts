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
    const response = await page.goto(`http://localhost:${port}`, {
      waitUntil: "load",
    });
    console.log("page status:", response?.status());

    await playwrightExpect(page.locator(".rounded-full").first()).toBeVisible({
      timeout: 10_000,
    });
    await playwrightExpect(page.getByText("Last login:")).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });

  it.concurrent("types out demo command and reaches wizard", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);

    await waitForWizard(page);

    await playwrightExpect(page.getByText("Chat with OpenAI")).toBeVisible();

    await page.close();
  });

  it.concurrent("shows the wizard after typewriter finishes", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);

    await waitForWizard(page);

    await playwrightExpect(page.getByText("Chat with OpenAI")).toBeVisible();
    await playwrightExpect(
      page.getByText("Generate an image using fal.ai"),
    ).toBeVisible();
    await playwrightExpect(
      page.getByText("Search the web using Parallel"),
    ).toBeVisible();
    await playwrightExpect(
      page.getByText("Summarize an article using Parallel"),
    ).toBeVisible();

    await page.close();
  });

  it.concurrent("wallet setup appears before wizard menu", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);

    // Wallet setup should appear before the wizard menu
    await playwrightExpect(
      page.getByText("Create a wallet", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      page.getByText("Add test funds", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await waitForWizard(page);

    await page.close();
  });

  it.concurrent('selects "Chat with OpenAI" and shows payment channel steps', async () => {
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
      page.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("Open payment channel")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("tokens streamed", { exact: false }),
    ).toBeVisible({ timeout: 20_000 });

    await playwrightExpect(
      page.getByText("Closed payment channel"),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(
      page.getByText("What would you like to do?").last(),
    ).toBeVisible({ timeout: 5_000 });

    await page.close();
  });

  it.concurrent('selects "Generate an image using fal.ai" via arrow key and shows charge steps', async () => {
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
      page.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("Fulfill payment")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("What would you like to do?").last(),
    ).toBeVisible({ timeout: 5_000 });

    await page.close();
  });

  it.concurrent("submits default prompt when Enter is pressed on empty input", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}`);
    await waitForWizard(page);

    await pressKey(page, "Enter");

    await playwrightExpect(page.getByText("Enter prompt:")).toBeVisible({
      timeout: 5_000,
    });

    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("Enter prompt: what are micropayments?", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(
      page.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await page.close();
  });

  it.concurrent('selects "Summarize an article using Parallel" and enters a URL', async () => {
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
    await page.keyboard.type("stratechery.com");
    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("(payment required)", { exact: false }),
    ).toBeVisible({
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

    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });

  it.concurrent("uses default URL and card values when Enter is pressed", async () => {
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

    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("Enter URL: https://stratechery.com", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(
      page.getByText("Card number:", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("Creating PaymentIntent"),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });

  it.concurrent("runs multiple times and returns to wizard", async () => {
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

    // Wait for the first run to complete and wizard to reappear
    await page.waitForSelector("[data-wizard-ready]", { timeout: 20_000 });

    // Second run: select "Generate image" again
    await pressKey(page, "ArrowDown");
    await pressKey(page, "Enter");

    await playwrightExpect(
      page.getByText("Enter prompt:", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
    await page.keyboard.type("another test");
    await page.keyboard.press("Enter");

    // Wait for the second run to fully complete (wizard ready for input)
    await page.waitForSelector("[data-wizard-ready]", { timeout: 20_000 });

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

    await playwrightExpect(
      page.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("Open payment channel")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("tokens streamed", { exact: false }),
    ).toBeVisible({ timeout: 20_000 });

    await playwrightExpect(
      page.getByText("Closed payment channel"),
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

    await playwrightExpect(
      page.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.getByText("Fulfill payment")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({
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

    await page.keyboard.type("stratechery.com");
    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

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

    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });
});

describe("terminal (one-time-payments guide)", () => {
  it.concurrent("renders the photo payment flow", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/guides/one-time-payments`, {
      waitUntil: "load",
    });

    const terminal = page.locator("[data-terminal]");

    // Terminal should render
    await playwrightExpect(terminal).toBeVisible({
      timeout: 15_000,
    });

    // Wait for hydration, then start the demo
    await page.waitForSelector("[data-demo-ready]", { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await page.locator("[data-demo-ready]").click();

    // Payment flow steps should appear
    await playwrightExpect(
      terminal.getByText("Create a wallet", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(terminal.getByText("Fulfill payment")).toBeVisible({
      timeout: 10_000,
    });

    await playwrightExpect(
      terminal.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 15_000,
    });

    // Photo should be rendered as an image
    await playwrightExpect(terminal.locator("img")).toBeVisible({
      timeout: 10_000,
    });

    // Restart prompt should appear
    await playwrightExpect(
      terminal.getByText("Press Enter or click to restart"),
    ).toBeVisible({ timeout: 10_000 });

    await page.close();
  });
});

describe("terminal (pay-as-you-go guide)", () => {
  it.concurrent("renders the gallery payment flow with session reuse", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/guides/pay-as-you-go`, {
      waitUntil: "load",
    });

    const terminal = page.locator("[data-terminal]");

    // Terminal should render
    await playwrightExpect(terminal).toBeVisible({
      timeout: 15_000,
    });

    // Wait for hydration, then start the demo
    await page.waitForSelector("[data-demo-ready]", { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await page.locator("[data-demo-ready]").click();

    // Payment channel flow steps
    await playwrightExpect(
      terminal.getByText("Create a wallet", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("Open payment channel"),
    ).toBeVisible({ timeout: 10_000 });

    // Count picker should appear
    await playwrightExpect(terminal.getByText("How many photos?")).toBeVisible({
      timeout: 10_000,
    });

    await playwrightExpect(
      terminal.getByText("3 photos ($0.03)"),
    ).toBeVisible();

    // Select 3 photos (first option, press Enter)
    await pressKey(page, "Enter");

    // Gallery images should be rendered
    await playwrightExpect(terminal.locator("img").first()).toBeVisible({
      timeout: 10_000,
    });

    // Summary line should show completion
    await playwrightExpect(terminal.getByText("0.03 USDC")).toBeVisible({
      timeout: 10_000,
    });

    // Picker should reappear with "Done" option (session reuse)
    await playwrightExpect(
      terminal.getByText("How many photos?").last(),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(terminal.getByText("Done")).toBeVisible({
      timeout: 5_000,
    });

    // Select Done (arrow down past 3 options to Done)
    await pressKey(page, "ArrowDown"); // → 5 photos
    await pressKey(page, "ArrowDown"); // → 10 photos
    await pressKey(page, "ArrowDown"); // → Done
    await pressKey(page, "Enter");

    // Close channel
    await playwrightExpect(
      terminal.getByText("Closed payment channel"),
    ).toBeVisible({ timeout: 10_000 });

    // Restart prompt should appear
    await playwrightExpect(
      terminal.getByText("Press Enter or click to restart"),
    ).toBeVisible({ timeout: 10_000 });

    await page.close();
  });
});

describe("terminal (streamed-payments guide)", () => {
  it.concurrent("renders the poem streaming flow", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/guides/streamed-payments`, {
      waitUntil: "load",
    });

    const terminal = page.locator("[data-terminal]");

    // Terminal should render
    await playwrightExpect(terminal).toBeVisible({
      timeout: 15_000,
    });

    // Wait for hydration, then start the demo
    await page.waitForSelector("[data-demo-ready]", { timeout: 10_000 });
    await page.waitForTimeout(2_000);
    await page.locator("[data-demo-ready]").click();

    // Payment channel flow steps
    await playwrightExpect(
      terminal.getByText("Create a wallet", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("Open payment channel"),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("tokens streamed", { exact: false }),
    ).toBeVisible({ timeout: 20_000 });

    await playwrightExpect(
      terminal.getByText("Closed payment channel"),
    ).toBeVisible({ timeout: 10_000 });

    // Restart prompt should appear
    await playwrightExpect(
      terminal.getByText("Press Enter or click to restart"),
    ).toBeVisible({ timeout: 10_000 });

    await page.close();
  });
});

describe("terminal (overview page)", () => {
  it.concurrent("renders the ping payment flow", async () => {
    const page = await newPage();
    await page.goto(`http://localhost:${port}/overview`, {
      waitUntil: "load",
    });

    const terminal = page.locator("[data-terminal]");

    // Terminal should render
    await playwrightExpect(terminal).toBeVisible({
      timeout: 15_000,
    });

    // Wait for hydration, then start the demo
    await page.waitForSelector("[data-demo-ready]", { timeout: 10_000 });
    // Extra wait for React hydration to attach onClick handler
    await page.waitForTimeout(2_000);
    await page.locator("[data-demo-ready]").click();

    // Payment flow steps should appear (simulated mode)
    await playwrightExpect(
      terminal.getByText("Create a wallet", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("Add test funds", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(
      terminal.getByText("(payment required)", { exact: false }),
    ).toBeVisible({ timeout: 10_000 });

    await playwrightExpect(terminal.getByText("Fulfill payment")).toBeVisible({
      timeout: 10_000,
    });

    await playwrightExpect(
      terminal.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.close();
  });
});
