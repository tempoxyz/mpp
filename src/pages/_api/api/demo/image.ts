import { mppx } from "../../../../mppx.server";
import { getProxyFetch } from "../../../../mppx-proxy-client";

const imageResults = [
  {
    id: "a1b2c3d4e5",
    url: "https://fal.ai/outputs/a1b2c3d4e5.png",
  },
  {
    id: "f6g7h8i9j0",
    url: "https://fal.ai/outputs/f6g7h8i9j0.png",
  },
  {
    id: "k1l2m3n4o5",
    url: "https://fal.ai/outputs/k1l2m3n4o5.png",
  },
  {
    id: "p6q7r8s9t0",
    url: "https://fal.ai/outputs/p6q7r8s9t0.png",
  },
  {
    id: "u1v2w3x4y5",
    url: "https://fal.ai/outputs/u1v2w3x4y5.png",
  },
];

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.003",
    description: "Image generation",
  })(request);

  if (result.status === 402) return result.challenge;

  const proxyFetch = getProxyFetch();
  const prompt = new URL(request.url).searchParams.get("prompt") ?? "untitled";

  if (!proxyFetch) {
    console.warn(
      `[demo/image] fal.ai unavailable for prompt="${prompt}": set FEE_PAYER_PRIVATE_KEY to enable paid generation.`,
    );
  }

  if (proxyFetch) {
    try {
      const res = await proxyFetch(
        "https://fal.mpp.moderato.tempo.xyz/fal-ai/flux/schnell",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            image_size: "square_hd",
            num_images: 1,
          }),
        },
      );

      if (res.ok) {
        const data = (await res.json()) as {
          images?: Array<{ url: string; width?: number; height?: number }>;
        };
        const img = data.images?.[0];
        if (img) {
          return result.withReceipt(
            Response.json({ lines: [img.url] }),
          );
        }
        console.warn(
          `[demo/image] fal.ai returned no images for prompt="${prompt}"`,
        );
      } else {
        const body = await res.text();
        console.error(
          `[demo/image] fal.ai request failed (${res.status} ${res.statusText}) for prompt="${prompt}": ${body.slice(0, 500)}`,
        );
      }
    } catch (e) {
      console.error(
        `[demo/image] mpp-proxy fal.ai error for prompt="${prompt}":`,
        e,
      );
    }
    // Fall through to canned response
  }

  const warning =
    "Using canned image result because live generation is unavailable right now.";
  console.warn(`[demo/image] ${warning} prompt=${prompt}`);
  const image = imageResults[Math.floor(Math.random() * imageResults.length)];

  return result.withReceipt(
    Response.json({ lines: [image.url], warning }),
  );
}
