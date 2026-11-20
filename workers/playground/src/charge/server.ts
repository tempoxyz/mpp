// MPP Charge Playground (mpp.dev/playground/charge): a fortune API that takes one payment per
// request.
//
//   GET /api/fortune   402 with a charge Challenge; with a Credential that pays it, a fortune
//                      and a Receipt.
//
// Each purchase is its own payment and its own transaction: no channel, no deposit.
import * as Charge from "../shared/charge-server.js";
import * as Fortunes from "./fortunes.js";
import { price } from "./prices.js";

type Env = Charge.Env;

let app: ReturnType<typeof Charge.create> | undefined;

/** The path mpp.dev serves the playground under. */
const base = "/playground/charge";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === base)
      return Response.redirect(new URL(`${base}/`, url), 302);
    if (!url.pathname.startsWith(`${base}/`))
      return new Response("Not found", { status: 404 });
    const path = url.pathname.slice(base.length);
    app ??= Charge.create(env, "charge");

    if (path === "/api/health") return Response.json({ status: "ok" });

    if (path === "/api/config")
      return Response.json({
        currency: Charge.ousd,
        payee: app.account.address,
        price,
      });

    if (path === "/api/fortune") {
      // No Credential (or one that doesn't pay): answer with a charge Challenge.
      const result = await app.mppx.charge({
        amount: price,
        description: "A fortune",
      })(request);
      if (result.status === 402) return result.challenge;
      // Paid: the fortune, with a Receipt naming the transaction.
      return result.withReceipt(Response.json(Fortunes.draw()));
    }

    return new Response("Not found", { status: 404 });
  },
};
