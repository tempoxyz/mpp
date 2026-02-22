"use client";

import type React from "react";
import { WagmiProvider } from "wagmi";
import { config } from "../wagmi.config";

export default function WagmiSetup(props: React.PropsWithChildren) {
  return <WagmiProvider config={config}>{props.children}</WagmiProvider>;
}
