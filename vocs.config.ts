import { defineConfig, McpSource } from "vocs/config";
import { sidebar } from "./sidebar";

const baseUrl = (() => {
	if (process.env.VERCEL_ENV === "production")
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	// Use localhost for local development
	if (process.env.NODE_ENV !== "production") return "http://localhost:5173";
	return "";
})();

export default defineConfig({
	accentColor: "light-dark(#9333EA, #C084FC)",
	baseUrl,
	description:
		"Machine Payments Protocol - Internet-native payments for machine-to-machine transactions",
	checkDeadlinks: true,
	iconUrl: {
		light: "/icon-light.png",
		dark: "/icon-dark.png",
	},
	mcp: {
		enabled: true,
		sources: [
			McpSource.github({ name: "mpay", repo: "wevm/mpay" }),
			McpSource.github({ name: "mpay-rs", repo: "tempoxyz/mpay-rs" }),
			McpSource.github({ name: "mpay-sdks", repo: "tempoxyz/mpay-sdks" }),
			McpSource.github({ name: "pympay", repo: "tempoxyz/pympay" }),
			McpSource.github({
				name: "payment-auth-spec",
				repo: "tempoxyz/payment-auth-spec",
			}),
			McpSource.github({ name: "tempo", repo: "tempoxyz/tempo" }),
		],
	},
	ogImageUrl: (path, { baseUrl: base } = { baseUrl: "" }) =>
		path === "/"
			? `${base}/og.png`
			: `${base}/api/og?title=%title&description=%description`,
	sidebar,
	twoslash: {
		twoslashOptions: {
			compilerOptions: {
				moduleResolution: 100,
			},
		},
	},
	socials: [
		{ icon: "github", link: "https://github.com/tempoxyz/payment-auth-spec" },
		{ icon: "x", link: "https://x.com/mpp" },
	],
	title: "MPP",
	titleTemplate: "%s | MPP",
	topNav: [
		{ text: "Docs", link: "/", match: "/" },
		{ text: "SDKs & Tools", link: "/sdk" },
		{ text: "Specifications", link: "https://paymentauth.tempo.xyz" },
		{
			text: "GitHub",
			items: [
				{ text: "mpay (TypeScript)", link: "https://github.com/wevm/mpay" },
				{ text: "mpay-rs (Rust)", link: "https://github.com/tempoxyz/mpay-rs" },
				{ text: "pympay (Python)", link: "https://github.com/tempoxyz/pympay" },
				{
					text: "Specifications",
					link: "https://github.com/tempoxyz/payment-auth-spec",
				},
				{ text: "Docs", link: "https://github.com/tempoxyz/mpp" },
			],
		},
	],
});
