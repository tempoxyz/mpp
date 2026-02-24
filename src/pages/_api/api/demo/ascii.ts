import { mppx } from "../../../../mppx.server";

const asciiArts = [
  [
    "       ╔══════════╗",
    "       ║  WALLET  ║",
    "       ╚════╤═════╝",
    "            │ sign",
    "       ╔════╧═════╗",
    "       ║ CHANNEL  ║",
    "       ╚════╤═════╝",
    "            │ stream",
    "       ╔════╧═════╗",
    "       ║ SERVICE  ║",
    "       ╚══════════╝",
  ],
  [
    "  ╭──────────────────────╮",
    "  │ MPP v1.0             │",
    "  │ ──────────────────── │",
    "  │ requests   1,204,891 │",
    "  │ payments   1,204,891 │",
    "  │ failures           0 │",
    "  │ avg cost    $0.00010 │",
    "  ╰──────────────────────╯",
  ],
];

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.001",
    description: "ASCII art",
  })(request);

  if (result.status === 402) return result.challenge;

  const art = asciiArts[Math.floor(Math.random() * asciiArts.length)];

  return result.withReceipt(Response.json({ lines: art }));
}
