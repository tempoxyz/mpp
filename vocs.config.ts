import { defineConfig, McpSource } from "vocs/config";

export default defineConfig({
	title: "MPP",
	titleTemplate: "%s | MPP",
	mcp: {
		enabled: true,
		sources: [
			McpSource.github({ name: "mpay", repo: "wevm/mpay" }),
			McpSource.github({ name: "mpay-rs", repo: "tempoxyz/mpay-rs" }),
			McpSource.github({ name: "mpay-sdks", repo: "tempoxyz/mpay-sdks" }),
			McpSource.github({ name: "pympay", repo: "tempoxyz/pympay" }),
			McpSource.github({ name: "payment-auth-spec", repo: "tempoxyz/payment-auth-spec" }),
			McpSource.github({ name: "tempo", repo: "tempoxyz/tempo" }),
		],
	},

	sidebar: {
		"/": [
			{
				text: "Home",
				link: "/",
			},
			{
				text: "Specs",
				link: "https://paymentauth.tempo.xyz/",
			},
			{
				text: "SDKs",
				items: [
					{
						text: "TypeScript",
						collapsed: true,
						items: [
							{ text: "Getting Started", link: "/sdk/typescript" },
							{
								text: "Client Reference",
								items: [
									{
										text: "Fetch",
										collapsed: true,
										items: [
											{ text: ".from", link: "/sdk/typescript/client/Fetch.from" },
											{ text: ".polyfill", link: "/sdk/typescript/client/Fetch.polyfill" },
											{ text: ".restore", link: "/sdk/typescript/client/Fetch.restore" },
										],
									},
									{
										text: "Method",
										collapsed: true,
										items: [
											{ text: ".tempo", link: "/sdk/typescript/client/Method.tempo" },
										],
									},
									{
										text: "Mpay",
										collapsed: true,
										items: [
											{ text: ".create", link: "/sdk/typescript/client/Mpay.create" },
										],
									},
									{
										text: "Transport",
										collapsed: true,
										items: [
											{ text: ".from", link: "/sdk/typescript/client/Transport.from" },
											{ text: ".http", link: "/sdk/typescript/client/Transport.http" },
											{ text: ".mcp", link: "/sdk/typescript/client/Transport.mcp" },
										],
									},
								],
							},
							{
								text: "Server Reference",
								items: [
									{
										text: "Method",
										collapsed: true,
										items: [
											{ text: ".tempo", link: "/sdk/typescript/server/Method.tempo" },
										],
									},
									{
										text: "Mpay",
										collapsed: true,
										items: [
											{ text: ".create", link: "/sdk/typescript/server/Mpay.create" },
											{ text: ".toNodeListener", link: "/sdk/typescript/server/Mpay.toNodeListener" },
										],
									},
									{
										text: "Transport",
										collapsed: true,
										items: [
											{ text: ".from", link: "/sdk/typescript/server/Transport.from" },
											{ text: ".http", link: "/sdk/typescript/server/Transport.http" },
											{ text: ".mcp", link: "/sdk/typescript/server/Transport.mcp" },
											{ text: ".mcpSdk", link: "/sdk/typescript/server/Transport.mcpSdk" },
										],
									},
								],
							},
							{
								text: "Core Reference",
								items: [
									{
										text: "BodyDigest",
										collapsed: true,
										items: [
											{ text: ".compute", link: "/sdk/typescript/BodyDigest.compute" },
											{ text: ".verify", link: "/sdk/typescript/BodyDigest.verify" },
										],
									},
									{
										text: "Challenge",
										collapsed: true,
										items: [
											{ text: ".deserialize", link: "/sdk/typescript/Challenge.deserialize" },
											{ text: ".from", link: "/sdk/typescript/Challenge.from" },
											{ text: ".fromHeaders", link: "/sdk/typescript/Challenge.fromHeaders" },
											{ text: ".fromIntent", link: "/sdk/typescript/Challenge.fromIntent" },
											{ text: ".fromResponse", link: "/sdk/typescript/Challenge.fromResponse" },
											{ text: ".serialize", link: "/sdk/typescript/Challenge.serialize" },
											{ text: ".verify", link: "/sdk/typescript/Challenge.verify" },
										],
									},
									{
										text: "Credential",
										collapsed: true,
										items: [
											{ text: ".deserialize", link: "/sdk/typescript/Credential.deserialize" },
											{ text: ".from", link: "/sdk/typescript/Credential.from" },
											{ text: ".fromRequest", link: "/sdk/typescript/Credential.fromRequest" },
											{ text: ".serialize", link: "/sdk/typescript/Credential.serialize" },
										],
									},
									{ text: "Expires", link: "/sdk/typescript/Expires" },
									{
										text: "Intent",
										collapsed: true,
										items: [
											{ text: ".authorize", link: "/sdk/typescript/Intent.authorize" },
											{ text: ".charge", link: "/sdk/typescript/Intent.charge" },
											{ text: ".from", link: "/sdk/typescript/Intent.from" },
											{ text: ".subscription", link: "/sdk/typescript/Intent.subscription" },
										],
									},
									{
										text: "Method",
										collapsed: true,
										items: [
											{ text: ".from", link: "/sdk/typescript/Method.from" },
											{ text: ".toClient", link: "/sdk/typescript/Method.toClient" },
											{ text: ".toServer", link: "/sdk/typescript/Method.toServer" },
										],
									},
									{
										text: "MethodIntent",
										collapsed: true,
										items: [
											{ text: ".from", link: "/sdk/typescript/MethodIntent.from" },
											{ text: ".fromIntent", link: "/sdk/typescript/MethodIntent.fromIntent" },
										],
									},
									{
										text: "PaymentRequest",
										collapsed: true,
										items: [
											{ text: ".deserialize", link: "/sdk/typescript/PaymentRequest.deserialize" },
											{ text: ".from", link: "/sdk/typescript/PaymentRequest.from" },
											{ text: ".fromIntent", link: "/sdk/typescript/PaymentRequest.fromIntent" },
											{ text: ".serialize", link: "/sdk/typescript/PaymentRequest.serialize" },
										],
									},
									{
										text: "Receipt",
										collapsed: true,
										items: [
											{ text: ".deserialize", link: "/sdk/typescript/Receipt.deserialize" },
											{ text: ".from", link: "/sdk/typescript/Receipt.from" },
											{ text: ".fromResponse", link: "/sdk/typescript/Receipt.fromResponse" },
											{ text: ".serialize", link: "/sdk/typescript/Receipt.serialize" },
										],
									},
								],
							},
						],
					},
					{
						text: "Rust",
						collapsed: true,
						items: [{ text: "Getting Started", link: "/sdk/rust" }],
					},
					{
						text: "Python",
						collapsed: true,
						items: [{ text: "Getting Started", link: "/sdk/python" }],
					},
				],
			},
		],
	},
});
