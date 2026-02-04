import { env } from "cloudflare:workers";
import type { MiddlewareHandler } from "vocs/server";

export function middleware(): MiddlewareHandler {
	return async (context, next) => {
		const url = new URL(context.req.url);
		if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
			return next();
		}

		const [AUTH_USER, AUTH_PASS] = (env.AUTH_CREDENTIALS ?? "user:pass").split(
			":",
		);

		if (!AUTH_PASS) {
			return next();
		}

		const authHeader = context.req.raw.headers.get("Authorization");
		if (!authHeader || !authHeader.startsWith("Basic ")) {
			context.res = unauthorized();
			return;
		}

		const authenticated = (() => {
			try {
				const credentials = atob(authHeader.slice(6));
				const [user, pass] = credentials.split(":");
				return user === AUTH_USER && pass === AUTH_PASS;
			} catch {
				return false;
			}
		})();

		if (!authenticated) {
			context.res = unauthorized();
			return;
		}

		return next();
	};
}

export default middleware;

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
