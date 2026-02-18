import { Mppx, tempo } from "mppx/client";
import { parseUnits } from "viem";
import { store } from "./components/Cli";
import { wrapFetch } from "./lib/network-store";
import { config } from "./wagmi.config";

const trackedFetch = wrapFetch(globalThis.fetch);

const maxDeposit = "1";

export const { fetch } = Mppx.create({
  fetch: trackedFetch,
  methods: [
    tempo({
      ...config.connectors.at(0),
      maxDeposit: maxDeposit,
      onChannelUpdate(entry) {
        store.setState((s) => ({
          ...s,
          sessionDeposit: entry.opened ? parseUnits(maxDeposit, 6) : 0n,
          sessionSpent: entry.cumulativeAmount,
        }));
      },
    }),
  ],
  polyfill: false,
});
