import { env } from "cloudflare:workers";
import { Mpay, tempo } from "mpay/server";
import type { Stream } from "mpay/tempo";
import { Json } from "ox";
import { createClient, type Hex, http } from "viem";

import { privateKeyToAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";

export const mpay = Mpay.create({
	methods: [
		tempo.stream({
			...(env.FEE_PAYER_PRIVATE_KEY
				? {
						feePayer: privateKeyToAccount(
							env.FEE_PAYER_PRIVATE_KEY as `0x${string}`,
						),
					}
				: {}),
			getClient() {
				const user = process.env.RPC_AUTH_USER;
				const pass = process.env.RPC_AUTH_PASS;
				const url = (() => {
					if (user && pass)
						return `https://${user}:${pass}@rpc.moderato.tempo.xyz`;
					return "https://rpc.moderato.tempo.xyz";
				})();
				return createClient({
					chain: tempoModerato,
					transport: http(url),
				});
			},
			storage: createKvStorage(env.MPAY_KV),
			testnet: true,
		}),
	],
	realm: "mpp.dev",
	secretKey: env.SECRET_KEY! ?? "top-secret",
});

export function createKvStorage(
	kv: KVNamespace,
): Stream.Storage.ChannelStorage {
	return {
		async getChannel(channelId: Hex) {
			const raw = await kv.get(`channel:${channelId}`);
			if (!raw) return null;
			return Json.parse(raw);
		},

		async getSession(challengeId: string) {
			const raw = await kv.get(`session:${challengeId}`);
			if (!raw) return null;
			return Json.parse(raw);
		},

		async updateChannel(channelId, fn) {
			console.log("updateChannel", channelId, fn);
			const current = await this.getChannel(channelId);
			const next = fn(current);
			console.log("updateChannel", channelId, next);
			if (next) await kv.put(`channel:${channelId}`, Json.stringify(next));
			else await kv.delete(`channel:${channelId}`);
			return next;
		},

		async updateSession(challengeId, fn) {
			console.log("updateSession", challengeId, fn);
			const current = await this.getSession(challengeId);
			const next = fn(current);
			if (next) await kv.put(`session:${challengeId}`, Json.stringify(next));
			else await kv.delete(`session:${challengeId}`);
			return next;
		},
	};
}
