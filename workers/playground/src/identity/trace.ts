// Records which steps of the server code ran for one request, so the page can light up
// the diagram and the matching source lines. Each step ID has a `// step: <id>` marker
// above the code it names; the page finds that line in the source it displays.

/** One step the server ran. */
export type Step = { id: string; detail?: string | undefined };

/** Response header carrying the steps, as base64url JSON. */
export const header = "Haiku-Trace";

/** Collects the steps of one request. */
export function create() {
  const steps: Step[] = [];
  return {
    step(id: string, detail?: string) {
      // Details can echo request input (the query string): cap them so the header stays small.
      steps.push(detail === undefined ? { id } : { id, detail: cap(detail) });
    },
    /** Returns a copy of `response` carrying the steps. */
    attach(response: Response): Response {
      const result = new Response(response.body, response);
      result.headers.set(header, encode(steps));
      return result;
    },
  };
}

export type Trace = ReturnType<typeof create>;

/** Longest detail kept, in characters. */
const maxDetail = 200;

function cap(detail: string) {
  return detail.length > maxDetail ? `${detail.slice(0, maxDetail)}…` : detail;
}

function encode(steps: Step[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify(steps));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

/** Decodes the steps of a response, or none. */
export function decode(value: string | null): Step[] {
  if (!value) return [];
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
    return JSON.parse(
      new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))),
    );
  } catch {
    return [];
  }
}
