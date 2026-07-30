import groupIconsStylesUrl from "virtual:vocs/group-icons.css?url";
import userStylesUrl from "virtual:vocs/user-styles";
import vocsStylesUrl from "../../node_modules/vocs/dist/styles/index.css?url";
import { SiteRootClient } from "../components/SiteRootClient";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html
      data-vocs=""
      data-vocs-theme="dark"
      lang="en"
      suppressHydrationWarning
      style={
        {
          colorScheme: "dark",
          "--vocs-color-accent": "#ffffff",
        } as React.CSSProperties
      }
    >
      <head>
        <meta charSet="utf-8" />
        <link rel="stylesheet" href={vocsStylesUrl} />
        {userStylesUrl && <link rel="stylesheet" href={userStylesUrl} />}
        {groupIconsStylesUrl && (
          <link rel="stylesheet" href={groupIconsStylesUrl} />
        )}
      </head>
      <body data-version="1.0">
        <SiteRootClient>{children}</SiteRootClient>
      </body>
    </html>
  );
}
