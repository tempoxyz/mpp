import { Mppx, tempo } from "mppx/client";
import { wrapFetch } from "./lib/network-store";
import { config } from "./wagmi.config";

const trackedFetch = wrapFetch(globalThis.fetch);

export const { fetch } = Mppx.create({
  fetch: trackedFetch,
  methods: [tempo(config.connectors.at(0))],
  polyfill: false,
});
