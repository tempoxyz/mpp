// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';


// prettier-ignore
type Page =
| { path: '/404'; render: 'static' }
| { path: '/_cli'; render: 'static' }
| { path: '/brand'; render: 'static' }
| { path: '/faq'; render: 'static' }
| { path: '/'; render: 'static' }
| { path: '/overview'; render: 'static' }
| { path: '/tools/tempoctl'; render: 'static' }
| { path: '/tools/tempoctl/examples'; render: 'static' }
| { path: '/specs'; render: 'static' }
| { path: '/sdk'; render: 'static' }
| { path: '/sdk/typescript/Challenge.fromIntent'; render: 'static' }
| { path: '/sdk/typescript/Intent.from'; render: 'static' }
| { path: '/sdk/typescript/MethodIntent.from'; render: 'static' }
| { path: '/sdk/typescript/MethodIntent.fromIntent'; render: 'static' }
| { path: '/sdk/typescript/PaymentRequest.fromIntent'; render: 'static' }
| { path: '/sdk/typescript'; render: 'static' }
| { path: '/sdk/typescript/server/Method.tempo.charge'; render: 'static' }
| { path: '/sdk/typescript/server/Method.tempo.stream'; render: 'static' }
| { path: '/sdk/typescript/server/Mpay.create'; render: 'static' }
| { path: '/sdk/typescript/server/Mpay.toNodeListener'; render: 'static' }
| { path: '/sdk/typescript/server/Request.fromNodeListener'; render: 'static' }
| { path: '/sdk/typescript/server/Response.requirePayment'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.from'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.http'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.mcp'; render: 'static' }
| { path: '/sdk/typescript/server/Transport.mcpSdk'; render: 'static' }
| { path: '/sdk/typescript/core/BodyDigest.compute'; render: 'static' }
| { path: '/sdk/typescript/core/BodyDigest.verify'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.from'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.fromHeaders'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.fromResponse'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.serialize'; render: 'static' }
| { path: '/sdk/typescript/core/Challenge.verify'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.extractPaymentScheme'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.from'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.fromRequest'; render: 'static' }
| { path: '/sdk/typescript/core/Credential.serialize'; render: 'static' }
| { path: '/sdk/typescript/core/Expires'; render: 'static' }
| { path: '/sdk/typescript/core/Intent.charge'; render: 'static' }
| { path: '/sdk/typescript/core/Intent.stream'; render: 'static' }
| { path: '/sdk/typescript/core/Mcp'; render: 'static' }
| { path: '/sdk/typescript/core/PaymentRequest.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/PaymentRequest.from'; render: 'static' }
| { path: '/sdk/typescript/core/PaymentRequest.serialize'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.deserialize'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.from'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.fromResponse'; render: 'static' }
| { path: '/sdk/typescript/core/Receipt.serialize'; render: 'static' }
| { path: '/sdk/typescript/client/Method.tempo.charge'; render: 'static' }
| { path: '/sdk/typescript/client/Method.tempo'; render: 'static' }
| { path: '/sdk/typescript/client/Method.tempo.stream'; render: 'static' }
| { path: '/sdk/typescript/client/Mpay.create'; render: 'static' }
| { path: '/sdk/typescript/client/Mpay.restore'; render: 'static' }
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
| { path: '/quickstart/server'; render: 'static' }
| { path: '/quickstart/tempoctl'; render: 'static' }
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
| { path: '/payment-methods/stripe'; render: 'static' }
| { path: '/payment-methods/tempo/charge'; render: 'static' }
| { path: '/payment-methods/tempo'; render: 'static' }
| { path: '/payment-methods/tempo/stream'; render: 'static' }
| { path: '/intents/charge'; render: 'static' }
| { path: '/guides/building-with-ai'; render: 'static' }
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
