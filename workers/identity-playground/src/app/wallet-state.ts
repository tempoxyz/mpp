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
};

/** OUSD on Tempo: what haiku are priced in. */
export const ousd = "0x20c0000000000000000000006a37DA5C996874BE" as const;
/** pathUSD on Moderato: OUSD can't pay fees, so the wallet pays them in pathUSD. */
export const pathUsd = "0x20c0000000000000000000000000000000000000" as const;
