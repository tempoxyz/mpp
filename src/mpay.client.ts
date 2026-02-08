import { Fetch, tempo } from "mpay/client";
import { wrapFetch } from "./lib/network-store";
import { config } from "./wagmi.config";

const trackedFetch = wrapFetch(globalThis.fetch);

console.log("test");
export const fetch = Fetch.from({
	fetch: trackedFetch,
	methods: [
		tempo.charge({
			async client(chainId) {
				console.log("test");
				const client = await config.connectors
					.at(0)
					?.getClient?.({ chainId: chainId as never });
				if (!client) return config.getClient({ chainId: chainId as never });
				return client;
			},
		}),
	],
});
