import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({
	env: {
		AUTH_CREDENTIALS: "admin",
		AUTH_PASS: "secret",
	},
}));

const { middleware } = await import("../../src/middleware/basic-auth.js");

function createContext(url: string, authHeader?: string) {
	const headers = new Headers();
	if (authHeader) headers.set("Authorization", authHeader);
	return {
		req: { url, raw: { headers } },
		res: undefined as Response | undefined,
	} as unknown as Parameters<ReturnType<typeof middleware>>[0];
}

function basicAuth(user: string, pass: string) {
	return `Basic ${btoa(`${user}:${pass}`)}`;
}

describe("basic-auth middleware", () => {
	const handler = middleware();

	it("skips auth for localhost", async () => {
		const ctx = createContext("http://localhost:5173/");
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).toHaveBeenCalled();
	});

	it("skips auth for 127.0.0.1", async () => {
		const ctx = createContext("http://127.0.0.1:5173/");
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).toHaveBeenCalled();
	});

	it("skips auth for preview URLs", async () => {
		const ctx = createContext(
			"https://brendan-switch-alphausd-to-pathusd-mpp-docs.porto.workers.dev/",
		);
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).toHaveBeenCalled();
	});

	it("skips auth for /api/ paths", async () => {
		const ctx = createContext("https://mpp.tempo.xyz/api/foo");
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).toHaveBeenCalled();
	});

	it("returns 401 when no credentials provided", async () => {
		const ctx = createContext("https://mpp.tempo.xyz/");
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).not.toHaveBeenCalled();
		expect(ctx.res?.status).toBe(401);
	});

	it("returns 401 for wrong credentials", async () => {
		const ctx = createContext(
			"https://mpp.tempo.xyz/",
			basicAuth("admin", "wrong"),
		);
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).not.toHaveBeenCalled();
		expect(ctx.res?.status).toBe(401);
	});

	it("allows valid credentials", async () => {
		const ctx = createContext(
			"https://mpp.tempo.xyz/",
			basicAuth("admin", "secret"),
		);
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).toHaveBeenCalled();
	});

	it("does not skip auth for production hostname", async () => {
		const ctx = createContext("https://mpp.tempo.xyz/");
		const next = vi.fn();
		await handler(ctx, next);
		expect(next).not.toHaveBeenCalled();
	});
});
