type JsonLd = Record<string, unknown> | readonly Record<string, unknown>[];

export function StructuredData({ data }: { data: JsonLd }) {
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON is serialized locally and escapes HTML opening characters.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}
