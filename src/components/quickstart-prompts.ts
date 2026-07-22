export const CLIENT_PROMPT = `Reference https://mpp.dev/quickstart/client.md

Add mppx to my app as a client.
Polyfill the global fetch to automatically handle 402 Payment Required responses using the Tempo payment method.
Make a request to https://mpp.dev/api/ping/paid to test.`;

export const SERVER_PROMPT = `Reference https://mpp.dev/quickstart/server.md

Add mppx to my server with a /api/test route that charges $0.01 per request using the Tempo payment method with USDC.e.
Use the mppx CLI to test your endpoint.`;
