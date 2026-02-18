import { Store, useStore } from "@tanstack/react-store";

export type Request = {
  description?: string;
  id: string;
  method: string;
  status: "pending" | "success" | "error";
  statusCode?: number;
  timestamp: number;
  url: string;
};

export const store = new Store<Request[]>([]);

export function add(request: Omit<Request, "id" | "timestamp">): string {
  const id = crypto.randomUUID();
  store.setState((requests) => [
    ...requests,
    { ...request, id, timestamp: Date.now() },
  ]);
  return id;
}

export function update(id: string, updates: Partial<Request>): void {
  store.setState((requests) =>
    requests.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  );
}

export function clear(): void {
  store.setState(() => []);
}

export function useRequests() {
  return useStore(store);
}

export function wrapFetch<
  fetch extends (...args: never[]) => Promise<Response>,
>(fetch: fetch): fetch {
  const wrapped = async (...args: Parameters<fetch>): Promise<Response> => {
    const [input, init] = args as unknown as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];
    const url = typeof input === "string" ? input : input.toString();
    const method = (init as RequestInit | undefined)?.method ?? "GET";

    const id = add({
      method,
      status: "pending",
      url,
    });

    try {
      const response = await fetch(...args);

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        update(id, {
          status: response.ok ? "success" : "error",
          statusCode: response.status,
        });
        return response;
      }

      const cloned = response.clone();

      let description: string | undefined;
      try {
        if (contentType.includes("json")) {
          const json = (await cloned.json()) as { detail?: string };
          description =
            typeof json.detail === "string" && json.detail
              ? json.detail
              : JSON.stringify(json);
        } else {
          description = await cloned.text();
        }
      } catch {}

      update(id, {
        description,
        status: response.ok ? "success" : "error",
        statusCode: response.status,
      });
      return response;
    } catch (error) {
      update(id, {
        status: "error",
      });
      throw error;
    }
  };
  return wrapped as fetch;
}
