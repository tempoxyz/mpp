import { discovery } from "mppx/nextjs";
import { mppx } from "../../../mppx.server";

export const GET = discovery(mppx, {
  info: { title: "mpp.dev", version: "1.0.0" },
  routes: [
    {
      handler: mppx.charge({
        amount: "0.1",
        currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
        description: "Ping endpoint access",
      }),
      method: "get",
      path: "/api/ping/paid",
      summary: "Paid ping — returns a greeting after payment",
    },
  ],
  serviceInfo: {
    categories: ["web"],
    docs: {
      homepage: "https://mpp.dev",
      llms: "https://mpp.dev/llms.txt",
    },
  },
});
