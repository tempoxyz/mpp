/** Where a playground lives and how the index links to it. */
export type PlaygroundStatus = "live" | "soon";

/** A small visual for the card grid: a screenshot or a terminal transcript. */
export type PlaygroundPreview =
  | { alt: string; kind: "image"; src: string }
  | { kind: "terminal"; lines: readonly string[] };

/** One interactive demo listed on /playground. */
export type Playground = {
  /** One line: what you do in it. */
  description: string;
  /**
   * Where it runs. Omit for entries that aren't live yet. A `document` link
   * loads the page from the server (Workers proxied under /playground), so it
   * renders as a plain anchor instead of a client route.
   */
  href?: string;
  /** Short label for the page that hosts it. */
  location: string;
  navigation?: "client" | "document";
  preview: PlaygroundPreview;
  slug: string;
  status: PlaygroundStatus;
  /** MPP features it shows, such as Charge or Identity. */
  tags: readonly string[];
  title: string;
};

/** Every playground, newest and most complete first. */
export const playgrounds: readonly Playground[] = [
  {
    description:
      "Buy a haiku using MPP. The more you prove, the less you pay and the more personal it gets.",
    href: "/playground/identity",
    location: "Playground",
    navigation: "document",
    preview: {
      alt: "The identity playground: pricing tiers, a haiku panel, and client and server code",
      kind: "image",
      src: "/playground/identity-preview.png",
    },
    slug: "identity",
    status: "live",
    tags: ["Identity", "Charge"],
    title: "Identity",
  },
  {
    description:
      "Watch an agent pay for chat, images, search, and article summaries from one terminal.",
    href: "/",
    location: "Home",
    navigation: "client",
    preview: {
      kind: "terminal",
      lines: [
        "$ ./mpp.sh",
        "Chat with OpenAI      $0.001",
        "Generate an image     $0.003",
        "Search the web        $0.005",
        "Summarize an article  Stripe",
      ],
    },
    slug: "agent-terminal",
    status: "live",
    tags: ["Charge", "Stripe"],
    title: "Agent terminal",
  },
  {
    description:
      "Create a wallet, fund it with testnet tokens, and make your first paid request.",
    href: "/overview#try-it-out",
    location: "Overview",
    navigation: "client",
    preview: {
      kind: "terminal",
      lines: [
        "$ GET /api/ping/paid",
        "402 Payment Required",
        "Paid $0.001",
        "200 OK  pong",
      ],
    },
    slug: "first-payment",
    status: "live",
    tags: ["Charge"],
    title: "First payment",
  },
  {
    description:
      "Pay $0.01 for a photo from a payment-gated API, one request at a time.",
    href: "/guides/one-time-payments#demo",
    location: "Charge guide",
    navigation: "client",
    preview: {
      kind: "terminal",
      lines: [
        "$ GET /api/photo",
        "402 Payment Required",
        "Paid $0.01",
        "200 OK  photo.jpg",
      ],
    },
    slug: "pay-per-request",
    status: "live",
    tags: ["Charge"],
    title: "Pay per request",
  },
  {
    description:
      "Reserve funds once, then pay per photo or per streamed word with near-zero fees.",
    href: "/guides/usage-based#try-it",
    location: "Sessions guide",
    navigation: "client",
    preview: {
      kind: "terminal",
      lines: [
        "$ GET /api/sessions/photo",
        "Session opened",
        "5 photos  $0.05",
        "$ GET /api/sessions/poem",
      ],
    },
    slug: "sessions",
    status: "live",
    tags: ["Session"],
    title: "Sessions",
  },
  {
    description:
      "Pay from a hosted payment page—no frontend required—and receive a random photo.",
    href: "/guides/payment-links#demo",
    location: "Payment links guide",
    navigation: "client",
    preview: {
      kind: "terminal",
      lines: [
        "GET /api/payment-link/photo",
        "402 Payment Required",
        "[ Continue with Tempo ]",
        "Pay $0.01",
      ],
    },
    slug: "payment-link",
    status: "live",
    tags: ["Charge", "Payment links"],
    title: "Payment link",
  },
  {
    description:
      "Present a Link attestation, Stripe's agent identity, to unlock the identity playground's top tier.",
    location: "Playground",
    preview: {
      kind: "terminal",
      lines: [
        "identity: [Link.Client.attestation()]",
        "requiresAuth: true",
        "Coming soon",
      ],
    },
    slug: "link-identity",
    status: "soon",
    tags: ["Identity", "Link"],
    title: "Link identity",
  },
];

/** Display labels for each status. */
export const statusLabel: Record<PlaygroundStatus, string> = {
  live: "Live",
  soon: "Coming soon",
};
