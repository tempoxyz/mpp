// Tempo testnet reads, the faucet and test-wallet keys, loaded on demand after first paint.
import { createClient, http, parseAbi, parseEventLogs } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { writeContractSync } from "viem/actions";
import { Actions, Chain } from "viem/tempo";

export const rpc = createClient({
  chain: Chain.testnet,
  pollingInterval: 500,
  transport: http(),
});

export { Actions, generatePrivateKey, privateKeyToAccount };

const registryAbi = parseAbi([
  "function register() returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

/**
 * Registers a new agent in the ERC-8004 Identity Registry: funds a fresh key from the faucet for
 * its network fee, then mints the agent's ID to it, so the key is the agent's wallet.
 */
export async function registerAgent(registry: `0x${string}`) {
  const key = generatePrivateKey();
  const account = privateKeyToAccount(key);
  // The registration's fee is paid in pathUSD, which the faucet sends.
  const client = createClient({
    account,
    chain: Chain.testnet.extend({
      feeToken: "0x20c0000000000000000000000000000000000000",
    }),
    transport: http(),
  });
  await Actions.faucet.fundSync(client, {
    account: account.address,
    timeout: 30_000,
  });
  const receipt = await writeContractSync(client, {
    abi: registryAbi,
    address: registry,
    args: [],
    functionName: "register",
  });
  const minted = parseEventLogs({
    abi: registryAbi,
    eventName: "Transfer",
    logs: receipt.logs,
  }).find((log) => log.address.toLowerCase() === registry.toLowerCase());
  if (receipt.status !== "success" || !minted)
    throw new Error("The agent registration failed.");
  return { agentId: minted.args.tokenId, key, tx: receipt.transactionHash };
}
