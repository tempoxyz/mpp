const BASE = "https://img.logo.dev";

export interface LogoDevOptions {
  token: string;
  size?: number;
  greyscale?: boolean;
  theme?: "dark" | "light";
  retina?: boolean;
}

export function logoDevUrl(
  domain: string,
  {
    token,
    size = 256,
    greyscale = true,
    theme = "dark",
    retina = true,
  }: LogoDevOptions,
): string {
  const params = new URLSearchParams({
    token,
    format: "png",
    size: String(size),
  });
  if (greyscale) params.set("greyscale", "true");
  if (theme) params.set("theme", theme);
  if (retina) params.set("retina", "true");
  return `${BASE}/${domain}?${params}`;
}
