import { discovery } from "mppx/nextjs";
import { mppx } from "../../../mppx.server";

const USDCe = "0x20c000000000000000000000b9537d11c60e8b50";

export const GET = discovery(mppx, {
  info: { title: "mpp.dev", version: "1.0.0" },
  routes: [
    {
      handler: mppx.charge({
        amount: "0.1",
        currency: USDCe,
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
