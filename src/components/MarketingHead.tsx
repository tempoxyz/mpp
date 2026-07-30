const SITE_URL = "https://mpp.dev";
const SITE_NAME = "MPP — Machine Payments Protocol";

export function MarketingHead({
  description,
  imageDescription,
  path,
  title,
}: {
  description: string;
  imageDescription: string;
  path: string;
  title: string;
}) {
  const canonical = `${SITE_URL}${path}`;
  const fullTitle = `${title} | MPP`;
  const image =
    path === "/"
      ? `${SITE_URL}/og.png`
      : `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(imageDescription)}&path=${encodeURIComponent(path)}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="color-scheme" content="dark" />
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:title" content={title} />
      <link rel="canonical" href={canonical} />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    </>
  );
}
