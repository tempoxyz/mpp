import { Mppx, tempo } from "mppx/client";
import { type Account, parseUnits } from "viem";
import { store } from "./components/Cli";
import { wrapFetch } from "./lib/network-store";
import { config } from "./wagmi.config";

const trackedFetch = wrapFetch(globalThis.fetch);

export const maxDeposit = "1";

const connectorConfig = config.connectors.at(0);

export const { fetch } = Mppx.create({
  fetch: trackedFetch,
  methods: [
    tempo({
      ...connectorConfig,
      maxDeposit,
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

export function session(parameters: { account: Account }) {
  return tempo.session({
    ...connectorConfig,
    account: parameters.account,
    fetch: trackedFetch,
    maxDeposit,
  });
}
