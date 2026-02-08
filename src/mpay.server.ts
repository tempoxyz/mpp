import { env } from "cloudflare:workers";
import { Mpay, tempo } from "mpay/server";
import { privateKeyToAccount } from "viem/accounts";

export const mpay = Mpay.create({
	methods: [
		tempo.charge({
			feePayer: privateKeyToAccount(
				env.FEE_PAYER_PRIVATE_KEY! as `0x${string}`,
			),
			testnet: true,
		}),
	],
	realm: "mpp.dev",
	secretKey: env.SECRET_KEY! ?? "top-secret",
});
