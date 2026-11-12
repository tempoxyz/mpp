// Tempo testnet reads, the faucet and test-wallet keys, loaded on demand after first paint.
import { createClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Actions, Chain } from "viem/tempo";

export const rpc = createClient({
  chain: Chain.testnet,
  pollingInterval: 500,
  transport: http(),
});

export { Actions, generatePrivateKey, privateKeyToAccount };
