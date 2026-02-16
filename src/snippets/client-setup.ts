// [!region imports]
import { Mppx, tempo } from "mppx/client";
import { privateKeyToAccount } from "viem/accounts";

// [!endregion imports]

// [!region account]
const account = privateKeyToAccount("0x...");
// [!endregion account]

// [!region fetch]
const mppx = Mppx.create({
  polyfill: false,
  methods: [tempo.charge({ account })],
});
// [!endregion fetch]

// [!region usage]
const _response = await mppx.fetch("https://api.example.com/resource");
// [!endregion usage]
