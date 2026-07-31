import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect as playwrightExpect } from "@playwright/test";
import type { Page } from "playwright";
import { type Browser, chromium } from "playwright";
import type { ViteDevServer } from "vite";
import { createServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let server: ViteDevServer;
let browser: Browser;
let baseUrl: string;
let cacheDir: string;
let port: number;

beforeAll(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), "mpp-terminal-e2e-"));
  server = await createServer({
    cacheDir,
    environments: {
      client: { optimizeDeps: { force: true } },
    },
    optimizeDeps: { force: true },
    server: { port: 0 },
    logLevel: "error",
  });
  await server.listen();
  const address = server.httpServer?.address();
  port = typeof address === "object" && address ? address.port : 5173;
  baseUrl =
    server.resolvedUrls?.local[0]?.replace(/\/$/, "") ??
    `http://localhost:${port}`;
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await server?.close();
  if (cacheDir) await rm(cacheDir, { recursive: true });
});

function newPage() {
  return browser.newPage({
    ignoreHTTPSErrors: true,
    viewport: { width: 1024, height: 768 },
  });
}

function pageUrl(path = "") {
  return `${baseUrl}${path}`;
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
  it("renders the terminal window", async () => {
    const page = await newPage();
    const response = await page.goto(pageUrl(), {
      waitUntil: "load",
    });
    console.log("page status:", response?.status());

    await playwrightExpect(page.locator("[data-terminal]").first()).toBeVisible(
      {
        timeout: 10_000,
      },
    );
    await playwrightExpect(page.getByText("mpp.dev@")).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });

  it("animates the marketing terminal without changing its footprint", async () => {
    const page = await newPage();
    await page.goto(pageUrl());

    const terminal = page.getByRole("application", {
      name: "MPP interactive terminal demo",
    });
    await playwrightExpect(terminal).toBeVisible({ timeout: 10_000 });
    await page.waitForSelector("[data-wizard-ready]", { timeout: 10_000 });

    const expandedBox = await terminal.boundingBox();
    expect(expandedBox).not.toBeNull();

    await page
      .getByRole("button", { name: "Minimize terminal", exact: true })
      .click();
    await playwrightExpect(
      page.getByRole("button", { name: "Expand terminal", exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(350);

    const collapsed = await terminal.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        bodyVisibility: getComputedStyle(element.children[1]).visibility,
        clipPath: style.clipPath,
        transitionDuration: style.transitionDuration,
      };
    });
    const collapsedBox = await terminal.boundingBox();

    expect(collapsedBox).toEqual(expandedBox);
    expect(collapsed).toEqual({
      bodyVisibility: "hidden",
      clipPath: "inset(calc(100% - 46px) 0px 0px calc(100% - 220px))",
      transitionDuration: "0.3s",
    });

    await page
      .getByRole("button", { name: "Expand terminal", exact: true })
      .click();
    await page.waitForTimeout(350);
    await expect
      .poll(() =>
        terminal.evaluate((element) => getComputedStyle(element).clipPath),
      )
      .toBe("inset(0px)");

    await page.close();
  });

  it("enlarges the marketing terminal into a closable viewport modal", async () => {
    const page = await newPage();
    await page.goto(pageUrl());

    const terminal = page.getByRole("application", {
      name: "MPP interactive terminal demo",
    });
    await playwrightExpect(terminal).toBeVisible({ timeout: 10_000 });
    await page.waitForSelector("[data-wizard-ready]", { timeout: 10_000 });
    await page.getByRole("button", { name: /Chat with OpenAI/ }).click();
    const prompt = page.getByRole("textbox");
    await playwrightExpect(prompt).toBeVisible({ timeout: 5_000 });
    await prompt.fill("preserve this prompt");

    await page
      .getByRole("button", { name: "Enlarge terminal", exact: true })
      .click();

    const modal = page.getByRole("dialog", { name: "MPP terminal" });
    await playwrightExpect(modal).toBeVisible();
    await playwrightExpect(prompt).toHaveValue("preserve this prompt");
    await playwrightExpect(
      page.getByRole("button", { name: "Close terminal", exact: true }),
    ).toHaveCount(2);
    const closeButton = modal.getByRole("button", {
      name: "Close terminal",
      exact: true,
    });
    await playwrightExpect(closeButton).toBeFocused();
    await playwrightExpect(
      page.locator(".terminal-fullscreen"),
    ).toHaveAttribute("tabindex", "-1");
    expect(
      await page.evaluate(() => {
        const portal = document.querySelector("[data-terminal-portal]");
        return Array.from(document.body.children)
          .filter((element) => element !== portal)
          .every((element) => (element as HTMLElement).inert);
      }),
    ).toBe(true);

    const modalBox = await modal.boundingBox();
    expect(modalBox).not.toBeNull();
    expect(modalBox?.x).toBeGreaterThanOrEqual(16);
    expect(modalBox?.y).toBeGreaterThanOrEqual(16);
    expect(modalBox?.width).toBeLessThanOrEqual(1080);
    expect(modalBox?.height).toBeLessThanOrEqual(640);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(
      "hidden",
    );

    await modal.evaluate((element) => {
      const focusable = Array.from(
        element.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((candidate) => candidate.getClientRects().length > 0);
      focusable.at(-1)?.focus();
    });
    await page.keyboard.press("Tab");
    expect(
      await modal.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);

    await closeButton.click();
    const enlargeButton = page.getByRole("button", {
      name: "Enlarge terminal",
      exact: true,
    });
    await playwrightExpect(enlargeButton).toBeVisible();
    await playwrightExpect(enlargeButton).toBeFocused();
    await playwrightExpect(prompt).toHaveValue("preserve this prompt");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
    expect(
      await page.evaluate(() =>
        Array.from(document.body.children).every(
          (element) => !(element as HTMLElement).inert,
        ),
      ),
    ).toBe(true);

    await page.close();
  });

  it("types out demo command and reaches wizard", async () => {
    const page = await newPage();
    await page.goto(pageUrl());

    await waitForWizard(page);

    await playwrightExpect(
      page.getByText("Chat with OpenAI").last(),
    ).toBeVisible();

    await page.close();
  });

  it("shows the wizard after typewriter finishes", async () => {
    const page = await newPage();
    await page.goto(pageUrl());

    await waitForWizard(page);

    await playwrightExpect(
      page.getByText("Chat with OpenAI").last(),
    ).toBeVisible();
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

  it("starts at wizard before wallet setup", async () => {
    const page = await newPage();
    await page.goto(pageUrl());

    await waitForWizard(page);

    await playwrightExpect(
      page.getByText("Create a wallet", { exact: false }),
    ).toBeHidden();

    await page.close();
  });

  it('selects "Chat with OpenAI" and streams after a one-time payment', async () => {
    const page = await newPage();
    await page.goto(pageUrl());
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

    await playwrightExpect(page.getByText("Fulfill payment")).toBeVisible({
      timeout: 5_000,
    });

    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(page.locator("pre")).not.toBeEmpty({
      timeout: 10_000,
    });

    await playwrightExpect(
      page.getByText("What would you like to do?").last(),
    ).toBeVisible({ timeout: 5_000 });

    await page.close();
  });

  it('selects "Generate an image using fal.ai" via arrow key and shows charge steps', async () => {
    const page = await newPage();
    await page.goto(pageUrl());
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

  it("submits default prompt when Enter is pressed on empty input", async () => {
    const page = await newPage();
    await page.goto(pageUrl());
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

  it('selects "Summarize an article using Parallel" and enters a URL', async () => {
    const page = await newPage();
    await page.goto(pageUrl());
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
      page.getByText("Creating payment_intent"),
    ).toBeVisible({ timeout: 5_000 });

    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });

  it("uses default URL and card values when Enter is pressed", async () => {
    const page = await newPage();
    await page.goto(pageUrl());
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
      page.getByText("Enter URL: https://stratechery.com", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(
      page.getByText("Card number:", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Enter");

    await playwrightExpect(
      page.getByText("Creating payment_intent"),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(
      page.getByText("(success)", { exact: false }),
    ).toBeVisible({
      timeout: 5_000,
    });

    await page.close();
  });

  it("runs multiple times and returns to wizard", async () => {
    const page = await newPage();
    await page.goto(pageUrl());
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

    // Second run: the completed item remains selected.
    await pressKey(page, "Enter");

    await playwrightExpect(
      page.getByText("Enter prompt:", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });
    await page.keyboard.type("another test");
    await page.keyboard.press("Enter");

    // Wait for the second run to fully complete (wizard ready for input)
    await page.waitForSelector("[data-wizard-ready]", { timeout: 20_000 });

    await playwrightExpect(
      page.getByText("What would you like to do?").last(),
    ).toBeVisible({ timeout: 5_000 });
    await playwrightExpect(
      page.getByText("Chat with OpenAI").last(),
    ).toBeVisible();

    await page.close();
  });
});

describe("terminal (classic mode)", () => {
  it("shows classic wizard options with ?mode=classic", async () => {
    const page = await newPage();
    await page.goto(pageUrl("/?mode=classic"));
    await waitForWizard(page);

    await playwrightExpect(page.getByText("Write poem")).toBeVisible();
    await playwrightExpect(page.getByText("Create ASCII art")).toBeVisible();
    await playwrightExpect(page.getByText("Lookup company")).toBeVisible();
    await playwrightExpect(page.getByText("Chat with AI")).toBeHidden();

    await page.close();
  });

  it('selects "Write poem" and shows payment channel steps', async () => {
    const page = await newPage();
    await page.goto(pageUrl("/?mode=classic"));
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

  it('selects "Create ASCII art" and shows charge steps', async () => {
    const page = await newPage();
    await page.goto(pageUrl("/?mode=classic"));
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

  it('selects "Lookup company" and shows Stripe steps', async () => {
    const page = await newPage();
    await page.goto(pageUrl("/?mode=classic"));
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
      page.getByText("Creating payment_intent"),
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
  it("renders the photo payment flow", async () => {
    const page = await newPage();
    await page.goto(pageUrl("/guides/one-time-payments"), {
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
  it("renders the gallery payment flow with session reuse", async () => {
    const page = await newPage();
    await page.goto(pageUrl("/guides/pay-as-you-go"), {
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
    await playwrightExpect(terminal.getByText("0.03 USD")).toBeVisible({
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
  it("renders the poem streaming flow", async () => {
    const page = await newPage();
    await page.goto(pageUrl("/guides/streamed-payments"), {
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
  it("renders the ping payment flow", async () => {
    const page = await newPage();
    await page.goto(pageUrl("/overview"), {
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
