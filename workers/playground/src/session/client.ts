// The browser client: an mppx session manager that pays with your linked Tempo Wallet or a
// test wallet. It opens a channel on the first story, pays each word with a voucher, tops up
// when a story runs past the deposit, and closes to settle.
import { createJsonChannelStore, tempo } from "mppx/client";
import { createClient, http } from "viem";
import { Chain } from "viem/tempo";
import { channelPrefix } from "./app/wallet-state.js";

/** What pays: the linked wallet's `provider.getMppxParameters()`, or `{ account }`. */
export type Wallet = Parameters<typeof tempo.session.manager>[0];

/** The session manager the page drives. */
export type Session = ReturnType<typeof tempo.session.manager>;

/** OUSD added when a story runs past the deposit. */
export const topUpAmount = "0.05";

const rpc = createClient({ chain: Chain.testnet, transport: http() });

/** Creates a session manager that reserves at most `maxDeposit` OUSD. */
export function create(options: {
  /** Fetch used for every HTTP hop, so the page can show them. */
  fetch: typeof globalThis.fetch;
  /** Most OUSD the channel may ever hold. */
  maxDeposit: string;
  /** The payer's address: channels persist per payer. */
  payer: string;
  wallet: Wallet;
}): Session {
  const { fetch, maxDeposit, payer, wallet } = options;
  const prefix = channelPrefix(payer);
  const channelStore = createJsonChannelStore({
    delete: (key) => localStorage.removeItem(prefix + key),
    get: (key) => localStorage.getItem(prefix + key) ?? undefined,
    set: (key, value) => localStorage.setItem(prefix + key, value),
  });
  return tempo.session.manager({
    getClient: () => rpc,
    ...wallet,
    allowedChainIds: [Chain.testnet.id],
    channelStore,
    fetch,
    maxDeposit,
    topUpAmount,
  });
}

/** The channel's deposit in base units, when the manager knows it. */
export function deposit(session: Session): bigint | undefined {
  const { state } = session;
  return "deposit" in state ? BigInt(state.deposit) : undefined;
}
