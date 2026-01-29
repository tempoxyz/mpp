// [!region imports]
import { Fetch, tempo } from "mpay/client";
import { privateKeyToAccount } from "viem/accounts";

// [!endregion imports]

// [!region account]
const account = privateKeyToAccount("0x...");
// [!endregion account]

// [!region fetch]
const fetch = Fetch.from({
	methods: [
		tempo({
			account,
			rpcUrl: "https://rpc.tempo.xyz",
		}),
	],
});
// [!endregion fetch]

// [!region usage]
const _response = await fetch("https://api.example.com/resource");
// [!endregion usage]
