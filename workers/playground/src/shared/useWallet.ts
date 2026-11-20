// The payer every charge playground shares: a linked Tempo Wallet, or a test wallet kept in
// localStorage and funded from the testnet faucet.
import { useEffect, useRef, useState } from "react";
import type { Address, Hex } from "viem";

import type * as Pay from "./pay.js";
import { ousd, testWalletKeys, unloaded, type Wallet } from "./wallet-state.js";

export const loadChain = () => import("./chain.js");
export const loadPay = () => import("./pay.js");

export function useWallet(onError: (message: string) => void) {
  const [wallet, setWallet] = useState<Wallet>(unloaded);
  const [testKey, setTestKey] = useState<Hex | null>(() =>
    typeof localStorage === "undefined"
      ? null
      : (localStorage.getItem(testWalletKeys.key) as Hex | null),
  );
  const [testAddress, setTestAddress] = useState<Address | undefined>(() =>
    typeof localStorage === "undefined"
      ? undefined
      : ((localStorage.getItem(testWalletKeys.address) as Address | null) ??
        undefined),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: derive the address only when the key changes
  useEffect(() => {
    if (!testKey) return;
    loadChain()
      .then(({ privateKeyToAccount }) => {
        const { address } = privateKeyToAccount(testKey);
        localStorage.setItem(testWalletKeys.address, address);
        setTestAddress(address);
      })
      .catch((e) => onError(`Couldn't load the test wallet: ${String(e)}`));
  }, [testKey]);
  const address = wallet.connected
    ? wallet.address
    : testKey
      ? testAddress
      : undefined;
  const addressRef = useRef(address);
  addressRef.current = address;

  // Fetch what the next click needs while the visitor reads.
  useEffect(() => {
    const warm = () => {
      loadChain().catch(() => undefined);
      if (address) loadPay().catch(() => undefined);
    };
    const id = setTimeout(warm, 800);
    return () => clearTimeout(id);
  }, [address]);

  const [balance, setBalance] = useState<string>();
  const [funding, setFunding] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refetch only when the payer changes
  useEffect(() => {
    setBalance(undefined);
    if (address) refreshBalance(address).catch(() => undefined);
  }, [address]);

  async function refreshBalance(account = address) {
    if (!account) return;
    const { Actions, rpc } = await loadChain();
    const value = await Actions.token.getBalance(rpc, { account, token: ousd });
    if (account !== addressRef.current) return;
    setBalance((Number(value.amount) / 1e6).toFixed(2));
  }

  async function fund(account = address) {
    if (!account) return;
    setFunding(true);
    try {
      const { Actions, rpc } = await loadChain();
      await Actions.faucet.fundSync(rpc, { account, timeout: 30_000 });
      await refreshBalance(account);
    } catch (e) {
      onError(`Faucet failed: ${String(e)}`);
    } finally {
      setFunding(false);
    }
  }

  function useTestWallet() {
    loadChain()
      .then(({ generatePrivateKey, privateKeyToAccount }) => {
        const key = generatePrivateKey();
        const { address } = privateKeyToAccount(key);
        localStorage.setItem(testWalletKeys.key, key);
        localStorage.setItem(testWalletKeys.address, address);
        setTestKey(key);
        setTestAddress(address);
        // A new test wallet holds nothing: fund it straight away.
        fund(address);
      })
      .catch((e) => onError(`Couldn't create a test wallet: ${String(e)}`));
  }

  /** What pays the next charge. */
  async function payer(): Promise<Pay.Wallet> {
    const linked = (await wallet.mppx()) as Pay.Wallet | undefined;
    if (linked) return linked;
    if (wallet.connected || !testKey)
      throw new Error("Wallet disconnected. Link Tempo Wallet and try again.");
    const { privateKeyToAccount } = await loadChain();
    return { account: privateKeyToAccount(testKey) };
  }

  return {
    address,
    balance,
    fund: () => fund(),
    funding,
    link: () => wallet.link(),
    /** Under 0.05 OUSD: offer the faucet. */
    low: balance !== undefined && Number(balance) < 0.05,
    payer,
    refreshBalance: () => refreshBalance().catch(() => undefined),
    setWallet,
    useTestWallet,
    wallet,
  };
}

export type PayerState = ReturnType<typeof useWallet>;
