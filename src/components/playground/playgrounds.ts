/** One interactive demo listed on /playground. */
export type Playground = {
  /** One line: what you do in it. */
  description: string;
  /** Served by its own Worker under /playground, so it loads as a document, not a client route. */
  href: string;
  slug: string;
  title: string;
};

export const playgrounds: readonly Playground[] = [
  {
    description: "Buy a haiku: the more you prove, the less you pay.",
    href: "/playground/identity",
    slug: "identity",
    title: "Identity",
  },
];
