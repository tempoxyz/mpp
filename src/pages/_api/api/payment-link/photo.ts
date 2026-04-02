import { mppx } from "../../../../mppx-payment-link.server";

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.01",
    description: "A random unique image",
  })(request);

  if (result.status === 402) return result.challenge;

  const res = await fetch("https://picsum.photos/1024/1024");
  const imageUrl = res.url;

  const html = `<!doctype html>
  <html lang="en">
  <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Photo — MPP Demo</title>
  <style>
  :root { color-scheme: dark light; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  font-family: system-ui, -apple-system, sans-serif;
  background: light-dark(#fafafa, #0a0a0a);
  color: light-dark(#111, #eee);
  }
  img {
  max-width: 480px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
  p {
  font-size: 13px;
  color: light-dark(#666, #888);
  }
  </style>
  </head>
  <body>
  <img src="${imageUrl}" alt="Random photo from Picsum" />
  <p>Paid via MPP — $0.01</p>
  </body>
  </html>`;

  return result.withReceipt(
    new Response(html, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
      },
    }),
  );
}
