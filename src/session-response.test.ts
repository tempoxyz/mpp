import { describe, expect, it } from "vitest";
import { sessionUpdateResponse } from "./session-response";

describe("sessionUpdateResponse", () => {
  it("passes an explicit empty response to withReceipt", () => {
    const response = sessionUpdateResponse({
      withReceipt(inner) {
        expect(inner.status).toBe(204);
        return new Response(null, { status: inner.status });
      },
    });

    expect(response.status).toBe(204);
  });
});
