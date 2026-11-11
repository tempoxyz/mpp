/** The linked Tempo Wallet, as WalletBridge reports it once the wallet stack loads. */
export type Wallet = {
  address: `0x${string}` | undefined;
  connected: boolean;
  error: Error | undefined;
  link: () => void;
  linking: boolean;
  /** The connected wallet's mppx parameters, or undefined without one. */
  mppx: () => Promise<unknown>;
  /** Whether the wallet stack has loaded, so link works. */
  ready: boolean;
  /** Disconnects the linked wallet; the page falls back to the test wallet, if any. */
  unlink: () => void;
};

/** Before the wallet stack loads: nothing linked yet. */
export const unloaded: Wallet = {
  address: undefined,
  connected: false,
  error: undefined,
  link: () => {},
  linking: false,
  mppx: async () => undefined,
  ready: false,
  unlink: () => {},
};

/** OUSD on Tempo: what words are priced in. */
export const ousd = "0x20c0000000000000000000006a37DA5C996874BE" as const;
/** pathUSD on Moderato: OUSD can't pay fees, so the wallet pays them in pathUSD. */
export const pathUsd = "0x20c0000000000000000000000000000000000000" as const;
/** Tempo's payment channel precompile (TIP-1034), where session deposits are reserved. */
export const channels = "0x4d50500000000000000000000000000000000000" as const;

/** Where the page keeps a payer's open channels, so a reload resumes one instead of opening another. */
export function channelPrefix(payer: string) {
  return `session.channel.${payer.toLowerCase()}.`;
}

/** Whether this payer left a channel open on an earlier visit. */
export function hasStoredChannel(payer: string) {
  const prefix = channelPrefix(payer);
  for (let i = 0; i < localStorage.length; i++)
    if (localStorage.key(i)?.startsWith(prefix)) return true;
  return false;
}
