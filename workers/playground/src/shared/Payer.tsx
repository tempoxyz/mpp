// The rows under a playground's panel: link a wallet or make a test wallet, then who pays.
import { lazy, Suspense } from "react";

import { explorer, LoadBoundary, short } from "./ui.js";
import type { PayerState } from "./useWallet.js";

const WalletBridge = lazy(() => import("./WalletBridge.js"));

/** Loads the wallet stack after first paint and reports it to the page. */
export function Bridge({ p }: { p: PayerState }) {
  return (
    <LoadBoundary fallback={null}>
      <Suspense fallback={null}>
        <WalletBridge onChange={p.setWallet} />
      </Suspense>
    </LoadBoundary>
  );
}

/** Link a wallet or make a test wallet. */
export function Connect({ p }: { p: PayerState }) {
  return (
    <div className="panel-row">
      <span className="prompt">❯</span>
      <button
        className="action"
        // Until the wallet stack loads, link can't open the wallet: replaying the click
        // later would lose its user gesture, so the button waits instead.
        disabled={!p.wallet.ready || p.wallet.linking}
        onClick={p.link}
        type="button"
      >
        {p.wallet.linking ? "Linking…" : "Link Tempo Wallet"}
      </button>
      <span className="dim">or</span>
      <button className="action" onClick={p.useTestWallet} type="button">
        use a test wallet
      </button>
    </div>
  );
}

/** Who pays, their OUSD, and the faucet when they run low. */
export function PayerRow({ busy, p }: { busy: boolean; p: PayerState }) {
  return (
    <div className="panel-row">
      <span className="dim">
        {p.wallet.connected ? "Linked" : "Test wallet"}
      </span>
      {p.address && (
        <a
          className="link"
          href={`${explorer}/address/${p.address}`}
          rel="noreferrer"
          target="_blank"
        >
          {short(p.address)}
        </a>
      )}
      {p.balance !== undefined && (
        <span className="dim">· {p.balance} OUSD</span>
      )}
      <span className="spacer" />
      {p.low && (
        <button
          className="action"
          disabled={p.funding}
          onClick={p.fund}
          type="button"
        >
          {p.funding ? "Funding…" : "Get test OUSD"}
        </button>
      )}
      {p.wallet.connected ? (
        <button
          className="action"
          disabled={busy}
          onClick={p.wallet.unlink}
          type="button"
        >
          Unlink
        </button>
      ) : (
        <button
          className="action"
          disabled={!p.wallet.ready || p.wallet.linking || busy}
          onClick={p.link}
          type="button"
        >
          {p.wallet.linking ? "Linking…" : "Link Tempo Wallet"}
        </button>
      )}
    </div>
  );
}
