// What the Zones playground's page and its decoy buyers share: the Tempo and Zone clients, a
// deposit into the Zone, and paying a charge Challenge from a Zone balance.
//
// mppx's client pays Zone Challenges itself (`tempo({ zone })`), but it reads the sender tag from
// the outbox's `WithdrawalRequested` event, which a Zone's redacted (account-scoped) RPC leaves
// out of receipts. Until mppx derives it another way, payFromZone does the same withdrawal and
// derives the tag from `lastFallbackNonce`, which the redacted RPC answers. The Credential is the
// one mppx builds, so the server is stock `tempo.charge({ zones })`.
import type { Challenge } from "mppx";
import { Credential } from "mppx";
import { Attribution } from "mppx/tempo";
import {
  type Account,
  type Address,
  type Client,
  createClient,
  encodePacked,
  type Hex,
  http,
  keccak256,
} from "viem";
import {
  getLogs,
  prepareTransactionRequest,
  readContract,
  sendRawTransactionSync,
  signTransaction,
} from "viem/actions";
import {
  Abis,
  Actions,
  Addresses,
  Chain,
  Store,
  Zone,
  http as zoneHttp,
} from "viem/tempo";

/** Where the playground's Tempo and Zone live: the Worker's /api/config. */
export type Config = {
  /** Parent Tempo chain: Moderato (42431), or a local dev node. */
  chainId: number;
  /** What a purchase costs, in the currency's units, such as "0.01". */
  price: string;
  /** The TIP-20 the Zone holds and the merchant is paid in. */
  currency: Address;
  /** Who gets paid on Tempo. */
  payee: Address;
  /** The Zone's portal on Tempo: every Zone payment arrives from it. */
  portal: Address;
  /** The Zone's chain ID and Zone ID, or undefined when the Worker has no Zone configured. */
  zone: { chainId: number; id: number; name: string } | undefined;
};

/** A Tempo client for the parent chain, through rpcUrl. */
export function tempoClient(config: Config, rpcUrl: string, account?: Account) {
  return createClient({
    account,
    chain: { ...Chain.testnet, id: config.chainId } as typeof Chain.testnet,
    pollingInterval: 500,
    transport: http(rpcUrl),
  });
}

/** A Zone client that sends the account's authorization token on every request. */
export function zoneClient(config: Config, rpcUrl: string, account: Account) {
  if (!config.zone) throw new Error("No Zone is configured.");
  const chain = Zone.from({
    id: config.zone.chainId,
    name: config.zone.name,
    sourceId: config.chainId,
  });
  // One store per client, so another account's token never rides along.
  const store = Store.memory();
  const client = createClient({
    account,
    chain,
    pollingInterval: 500,
    transport: zoneHttp(rpcUrl, { store }),
  });
  const zoneId = config.zone.id;
  return {
    client,
    /** Signs the token that lets this account read its own Zone balance and activity. */
    authorize: () =>
      Actions.zone.signAuthorizationToken(client, { store, zoneId }),
  };
}

/** Moves amount from Tempo into the account's Zone balance. Returns once Tempo accepted it. */
export async function deposit(tempo: Client, config: Config, amount: bigint) {
  if (!config.zone) throw new Error("No Zone is configured.");
  const { receipt } = await Actions.zone.encryptedDepositSync(tempo, {
    account: tempo.account,
    amount,
    chain: tempo.chain,
    token: config.currency,
    zoneId: config.zone.id,
  } as never);
  return receipt.transactionHash;
}

/** The account's balance in the Zone, in base units. */
export async function zoneBalance(
  zone: Client<any, any, Account>,
  token: Address,
) {
  const { amount } = await Actions.token.getBalance(zone, {
    account: zone.account.address,
    token,
  });
  return amount;
}

/** What a Zone payment left behind: the Credential, and what it reveals. */
export type Paid = {
  credential: string;
  /** The Tempo transaction in which the portal paid the merchant. */
  hash: Hex;
  /** Names the withdrawal on Tempo in place of the payer's address. */
  senderTag: Hex;
  /** The withdrawal on the Zone: only the payer and the operator can read it. */
  zoneTransaction: Hex;
};

/**
 * Pays a charge Challenge from the account's Zone balance: a withdrawal to the merchant with
 * the Challenge-bound memo. Waits until the portal pays on Tempo, then returns the `zone`
 * Credential that names it.
 */
export async function payFromZone(options: {
  challenge: Challenge.Challenge;
  config: Config;
  tempo: Client;
  zone: Client<any, any, Account>;
  timeoutMs?: number;
}): Promise<Paid> {
  const { challenge, config, tempo, zone, timeoutMs = 60_000 } = options;
  if (!config.zone) throw new Error("No Zone is configured.");
  const request = challenge.request as {
    amount: string;
    currency: Address;
    recipient: Address;
  };
  const amount = BigInt(request.amount);
  const account = zone.account;
  const memo = Attribution.encode({
    challengeId: challenge.id,
    serverId: challenge.realm,
  });
  // The outbox pulls the amount plus its withdrawal fee.
  const fee = await Actions.zone.getWithdrawalFee(zone);
  const [, withdrawal] = Actions.zone.requestWithdrawal.calls({
    amount,
    // A bounced payout refunds the payer, not the merchant's Zone address.
    fallbackRecipient: account.address,
    memo,
    to: request.recipient,
    token: request.currency,
  });
  const prepared = await prepareTransactionRequest(zone, {
    account,
    calls: [
      Actions.token.approve.call({
        amount: amount + fee,
        spender: Addresses.zoneOutbox,
        token: request.currency,
      }),
      withdrawal,
    ],
  } as never);
  const serializedTransaction = await signTransaction(zone, prepared as never);
  const receipt = await sendRawTransactionSync(zone, { serializedTransaction });
  if (receipt.status !== "success")
    throw new Error(`The Zone withdrawal ${receipt.transactionHash} reverted.`);

  // Each withdrawal takes the outbox's next fallback nonce. Others in the same block take
  // theirs too, so every nonce the block used is a candidate; the portal's event says which.
  const nonceAt = (blockNumber: bigint) =>
    readContract(zone, {
      abi: Abis.zoneOutbox,
      address: Addresses.zoneOutbox,
      blockNumber,
      functionName: "lastFallbackNonce",
    }) as Promise<bigint>;
  const [after, before] = await Promise.all([
    nonceAt(receipt.blockNumber),
    nonceAt(receipt.blockNumber - 1n),
  ]);
  const tags = new Map<Hex, Hex>();
  for (let nonce = before + 1n; nonce <= after; nonce++) {
    const tag = keccak256(
      encodePacked(
        ["address", "bytes32", "uint64"],
        [account.address, receipt.transactionHash, nonce],
      ),
    );
    tags.set(tag.toLowerCase() as Hex, tag);
  }

  // Wait for the portal to pay the merchant on Tempo for one of those tags.
  const event = Abis.zonePortal.find(
    (item) => item.type === "event" && item.name === "WithdrawalProcessed",
  ) as never;
  const start = await getBlockNumber(tempo);
  const deadline = Date.now() + timeoutMs;
  let fromBlock = start > 50n ? start - 50n : 0n;
  while (Date.now() < deadline) {
    const toBlock = await getBlockNumber(tempo);
    if (toBlock >= fromBlock) {
      const logs = (await getLogs(tempo, {
        address: config.portal,
        args: { senderTag: [...tags.values()], to: request.recipient },
        event,
        fromBlock,
        toBlock,
      } as never)) as unknown as {
        args: { senderTag: Hex };
        transactionHash: Hex;
      }[];
      const log = logs.find((log) =>
        tags.has(log.args.senderTag.toLowerCase() as Hex),
      );
      if (log) {
        const senderTag = log.args.senderTag;
        return {
          credential: Credential.serialize({
            challenge,
            payload: {
              hash: log.transactionHash,
              senderTag,
              type: "zone",
              zoneId: config.zone.id,
            },
          }),
          hash: log.transactionHash,
          senderTag,
          zoneTransaction: receipt.transactionHash,
        };
      }
      fromBlock = toBlock + 1n;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("The portal hasn't paid the merchant on Tempo yet.");
}

async function getBlockNumber(client: Client) {
  return BigInt(
    (await client.request({ method: "eth_blockNumber" } as never)) as Hex,
  );
}
