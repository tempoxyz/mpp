"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import type React from "react";

const WagmiSetup = lazy(() => import("../lib/wagmi-provider"));

const queryClient = new QueryClient();

export default function Layout(props: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={props.children}>
        <WagmiSetup>{props.children}</WagmiSetup>
      </Suspense>
    </QueryClientProvider>
  );
}
