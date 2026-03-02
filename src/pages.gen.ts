// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';


// prettier-ignore
type Page =
| { path: '/404'; render: 'static' }
| { path: '/brand'; render: 'static' }
| { path: '/faq'; render: 'static' }
| { path: '/'; render: 'static' }
| { path: '/overview'; render: 'static' }
| { path: '/services'; render: 'static' }
| { path: '/tools/presto'; render: 'static' }
| { path: '/tools/presto/examples'; render: 'static' }
| { path: '/sdk'; render: 'static' }
| { path: '/sdk/typescript/Method.from'; render: 'static' }
| { path: '/sdk/typescript/cli'; render: 'static' }
| { path: '/sdk/typescript'; render: 'static' }
| { path: '/sdk/typescript/server/Method.tempo.charge'; render: 'static' }
| { path: '/sdk/typescript/server/Method.tempo.session'; render: 'static' }
| { path: '/sdk/typescript/server/Mppx.create'; render: 'static' }
| { path: '/sdk/typescript/server/Mppx.toNodeListener'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.from'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.http'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.mcp'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.mcpSdk'; render: 'static' }
| { path: '/sdk/typescript/middlewares/elysia'; render: 'static' }
| { path: '/sdk/typescript/middlewares/express'; render: 'static' }
| { path: '/sdk/typescript/middlewares/hono'; render: 'static' }
| { path: '/sdk/typescript/middlewares/nextjs'; render: 'static' }
| { path: '/sdk/typescript/core/BodyDigest.compute'; render: 'static' }
| { path: '/sdk/typescript/core/BodyDigest.verify'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.from'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.fromHeaders'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.fromMethod'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.fromResponse'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.meta'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.serialize'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.verify'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.from'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.fromRequest'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.serialize'; render: 'static' }
| { path: '/sdk/typescript/core/Expires'; render: 'static' }
| { path: '/sdk/typescript/core/Method.from'; render: 'static' }
| { path: '/sdk/typescript/core/Method.toClient'; render: 'static' }
| { path: '/sdk/typescript/core/Method.toServer'; render: 'static' }
| { path: '/sdk/typescript/core/PaymentRequest.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/PaymentRequest.from'; render: 'static' }
| { path: '/sdk/typescript/core/PaymentRequest.serialize'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.from'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.fromResponse'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.serialize'; render: 'static' }
| { path: '/sdk/typescript/client/Method.tempo.charge'; render: 'static' }
| { path: '/sdk/typescript/client/Method.tempo'; render: 'static' }
| { path: '/sdk/typescript/client/Method.tempo.session'; render: 'static' }
| { path: '/sdk/typescript/client/Mppx.create'; render: 'static' }
| { path: '/sdk/typescript/client/Mppx.restore'; render: 'static' }
| { path: '/sdk/typescript/client/Transport.from'; render: 'static' }
| { path: '/sdk/typescript/client/Transport.http'; render: 'static' }
| { path: '/sdk/typescript/client/Transport.mcp'; render: 'static' }
| { path: '/sdk/rust/client'; render: 'static' }
| { path: '/sdk/rust'; render: 'static' }
| { path: '/sdk/rust/server'; render: 'static' }
| { path: '/sdk/python/client'; render: 'static' }
| { path: '/sdk/python/core'; render: 'static' }
| { path: '/sdk/python'; render: 'static' }
| { path: '/sdk/python/server'; render: 'static' }
| { path: '/quickstart/client'; render: 'static' }
| { path: '/quickstart'; render: 'static' }
| { path: '/quickstart/presto'; render: 'static' }
| { path: '/quickstart/server'; render: 'static' }
| { path: '/protocol/challenges'; render: 'static' }
| { path: '/protocol/credentials'; render: 'static' }
| { path: '/protocol/http-402'; render: 'static' }
| { path: '/protocol'; render: 'static' }
| { path: '/protocol/receipts'; render: 'static' }
| { path: '/protocol/transports/http'; render: 'static' }
| { path: '/protocol/transports'; render: 'static' }
| { path: '/protocol/transports/mcp'; render: 'static' }
| { path: '/payment-methods/custom'; render: 'static' }
| { path: '/payment-methods'; render: 'static' }
| { path: '/payment-methods/tempo/charge'; render: 'static' }
| { path: '/payment-methods/tempo'; render: 'static' }
| { path: '/payment-methods/tempo/session'; render: 'static' }
| { path: '/payment-methods/stripe/charge'; render: 'static' }
| { path: '/payment-methods/stripe'; render: 'static' }
| { path: '/intents/charge'; render: 'static' }
| { path: '/guides/building-with-ai'; render: 'static' }
| { path: '/guides/one-time-payments'; render: 'static' }
| { path: '/guides/pay-as-you-go'; render: 'static' }
| { path: '/guides/streamed-payments'; render: 'static' }
| { path: '/_api/api/og'; render: 'static' };

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>;
  }
  interface CreatePagesConfig {
    pages: Page;
  }
}
