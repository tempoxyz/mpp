import { env } from "cloudflare:workers";
import type { MiddlewareHandler } from "vocs/server";

const SKIP_AUTH_PATTERNS = [/^\/api\//];

export function middleware(): MiddlewareHandler {
	return async (context, next) => {
		const url = new URL(context.req.url);
		if (
			url.hostname === "localhost" ||
			url.hostname === "127.0.0.1" ||
			url.hostname.endsWith("-mpp-docs.porto.workers.dev")
		) {
			return next();
		}

		if (SKIP_AUTH_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
			return next();
		}

		const AUTH_USER = env.AUTH_CREDENTIALS;
		const AUTH_PASS = env.AUTH_PASS;

		if (!AUTH_PASS) {
			return next();
		}

		const authHeader = context.req.raw.headers.get("Authorization");
		const credentials = extractBasicCredentials(authHeader);
		if (!credentials) {
			context.res = unauthorized();
			return;
		}

		const authenticated =
			credentials.user === AUTH_USER && credentials.pass === AUTH_PASS;

		if (!authenticated) {
			context.res = unauthorized();
			return;
		}

		return next();
	};
}

export default middleware;

function extractBasicCredentials(
	header: string | null,
): { user: string; pass: string } | undefined {
	if (!header) return undefined;
	const schemes = header.split(",").map((s) => s.trim());
	const basic = schemes.find((s) => s.startsWith("Basic "));
	if (!basic) return undefined;
	try {
		const decoded = atob(basic.slice(6));
		const [user, ...rest] = decoded.split(":");
		return { user, pass: rest.join(":") };
	} catch {
		return undefined;
	}
}

function unauthorized() {
	return new Response("Unauthorized", {
		status: 401,
		headers: {
			"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
			"Content-Type": "text/plain",
			"WWW-Authenticate": 'Basic realm="mpp-docs"',
		},
	});
}
