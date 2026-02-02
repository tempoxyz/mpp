import type { Config } from "vocs/config";

export const sidebar = {
	"/": [
		{
			text: "Introduction",
			items: [
				{ text: "Overview", link: "/" },
				{ text: "Specifications", link: "https://paymentauth.tempo.xyz/" },
				{ text: "FAQ", link: "/faq" },
			],
		},
		{
			text: "Quick Start",
			items: [
				{ text: "Client", link: "/quickstart/client" },
				{ text: "Server", link: "/quickstart/server" },
				{ text: "pget CLI", link: "/quickstart/pget" },
			],
		},
		{
			text: "Guides",
			items: [
				{ text: "Build with AI", link: "/guides/building-with-ai" },
				{ text: "Accept One-Time Payments 🚧", disabled: true },
				{ text: "Accept Pay-As-You-Go Payments 🚧", disabled: true },
			],
		},
		{
			text: "Protocol",
			items: [
				{ text: "Overview", link: "/protocol" },
				{ text: "HTTP 402", link: "/protocol/http-402" },
				{ text: "Challenges", link: "/protocol/challenges" },
				{ text: "Credentials", link: "/protocol/credentials" },
				{ text: "Receipts", link: "/protocol/receipts" },
				{
					text: "Transports",
					link: "/protocol/transports",
					items: [
						{ text: "HTTP", link: "/protocol/transports/http" },
						{ text: "MCP", link: "/protocol/transports/mcp" },
					],
				},
			],
		},

		{
			text: "Payment Methods",
			items: [
				{ text: "Overview", link: "/payment-methods" },
				{ text: "Tempo", link: "/payment-methods/tempo" },
				{ text: "Stripe", link: "/payment-methods/stripe" },
				{ text: "Custom", link: "/payment-methods/custom" },
			],
		},
		{
			text: "SDKs & Tools",
			items: [
				{ text: "Overview", link: "/sdk" },
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
										{
											text: ".from",
											link: "/sdk/typescript/client/Fetch.from",
										},
										{
											text: ".polyfill",
											link: "/sdk/typescript/client/Fetch.polyfill",
										},
										{
											text: ".restore",
											link: "/sdk/typescript/client/Fetch.restore",
										},
									],
								},
								{
									text: "Mpay",
									collapsed: true,
									items: [
										{
											text: ".create",
											link: "/sdk/typescript/client/Mpay.create",
										},
									],
								},
								{
									text: "Transport",
									collapsed: true,
									items: [
										{
											text: ".from",
											link: "/sdk/typescript/client/Transport.from",
										},
										{
											text: ".http",
											link: "/sdk/typescript/client/Transport.http",
										},
										{
											text: ".mcp",
											link: "/sdk/typescript/client/Transport.mcp",
										},
									],
								},
								{
									text: "Method",
									collapsed: true,
									items: [
										{
											text: ".tempo",
											link: "/sdk/typescript/client/Method.tempo",
										},
									],
								},
							],
						},
						{
							text: "Server Reference",
							items: [
								{
									text: "Mpay",
									collapsed: true,
									items: [
										{
											text: ".create",
											link: "/sdk/typescript/server/Mpay.create",
										},
										{
											text: ".toNodeListener",
											link: "/sdk/typescript/server/Mpay.toNodeListener",
										},
									],
								},
								{
									text: "Transport",
									collapsed: true,
									items: [
										{
											text: ".from",
											link: "/sdk/typescript/server/Transport.from",
										},
										{
											text: ".http",
											link: "/sdk/typescript/server/Transport.http",
										},
										{
											text: ".mcp",
											link: "/sdk/typescript/server/Transport.mcp",
										},
										{
											text: ".mcpSdk",
											link: "/sdk/typescript/server/Transport.mcpSdk",
										},
									],
								},
								{
									text: "Method",
									collapsed: true,
									items: [
										{
											text: ".tempo",
											link: "/sdk/typescript/server/Method.tempo",
										},
									],
								},
							],
						},
						{
							text: "Core Reference",
							items: [
								{
									text: "Challenge",
									collapsed: true,
									items: [
										{
											text: ".deserialize",
											link: "/sdk/typescript/core/Challenge.deserialize",
										},
										{
											text: ".from",
											link: "/sdk/typescript/core/Challenge.from",
										},
										{
											text: ".fromHeaders",
											link: "/sdk/typescript/core/Challenge.fromHeaders",
										},
										{
											text: ".fromResponse",
											link: "/sdk/typescript/core/Challenge.fromResponse",
										},
										{
											text: ".serialize",
											link: "/sdk/typescript/core/Challenge.serialize",
										},
										{
											text: ".verify",
											link: "/sdk/typescript/core/Challenge.verify",
										},
									],
								},
								{
									text: "Credential",
									collapsed: true,
									items: [
										{
											text: ".deserialize",
											link: "/sdk/typescript/core/Credential.deserialize",
										},
										{
											text: ".from",
											link: "/sdk/typescript/core/Credential.from",
										},
										{
											text: ".fromRequest",
											link: "/sdk/typescript/core/Credential.fromRequest",
										},
										{
											text: ".serialize",
											link: "/sdk/typescript/core/Credential.serialize",
										},
									],
								},
								{
									text: "Receipt",
									collapsed: true,
									items: [
										{
											text: ".deserialize",
											link: "/sdk/typescript/core/Receipt.deserialize",
										},
										{
											text: ".from",
											link: "/sdk/typescript/core/Receipt.from",
										},
										{
											text: ".fromResponse",
											link: "/sdk/typescript/core/Receipt.fromResponse",
										},
										{
											text: ".serialize",
											link: "/sdk/typescript/core/Receipt.serialize",
										},
									],
								},
								{
									text: "PaymentRequest",
									collapsed: true,
									items: [
										{
											text: ".deserialize",
											link: "/sdk/typescript/core/PaymentRequest.deserialize",
										},
										{
											text: ".from",
											link: "/sdk/typescript/core/PaymentRequest.from",
										},
										{
											text: ".serialize",
											link: "/sdk/typescript/core/PaymentRequest.serialize",
										},
									],
								},
								{
									text: "BodyDigest",
									collapsed: true,
									items: [
										{
											text: ".compute",
											link: "/sdk/typescript/core/BodyDigest.compute",
										},
										{
											text: ".verify",
											link: "/sdk/typescript/core/BodyDigest.verify",
										},
									],
								},
								{ text: "Expires", link: "/sdk/typescript/core/Expires" },
							],
						},
					],
				},
				{
					text: "Python",
					collapsed: true,
					items: [
						{ text: "Overview", link: "/sdk/python" },
						{ text: "Core Types", link: "/sdk/python/core" },
						{ text: "Client", link: "/sdk/python/client" },
						{ text: "Server", link: "/sdk/python/server" },
					],
				},
				{
					text: "Rust",
					collapsed: true,
					items: [
						{ text: "Overview", link: "/sdk/rust" },
						{ text: "Client", link: "/sdk/rust/client" },
						{ text: "Server", link: "/sdk/rust/server" },
					],
				},
				{
					text: "pget CLI",
					collapsed: true,
					items: [
						{ text: "Reference", link: "/tools/pget" },
						{ text: "Examples", link: "/tools/pget/examples" },
					],
				},
			],
		},
	],
} as const satisfies Config["sidebar"];
