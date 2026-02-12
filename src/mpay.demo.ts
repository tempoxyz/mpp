import { Mpay, tempo } from "mpay/client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { wrapFetch } from "./lib/network-store";

const STORAGE_KEY = "mpp-demo-private-key";

function getDemoPrivateKey(): `0x${string}` {
	if (typeof window === "undefined") {
		// SSR fallback - generate ephemeral key
		return generatePrivateKey();
	}

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && stored.startsWith("0x") && stored.length === 66) {
		return stored as `0x${string}`;
	}

	const newKey = generatePrivateKey();
	localStorage.setItem(STORAGE_KEY, newKey);
	return newKey;
}

export const demoAccount = privateKeyToAccount(getDemoPrivateKey());

const trackedFetch = wrapFetch(globalThis.fetch);

const mpay = Mpay.create({
	fetch: trackedFetch,
	methods: [tempo.charge({ account: demoAccount })],
	polyfill: false,
});

export const demoFetch = mpay.fetch;
