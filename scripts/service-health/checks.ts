import { Challenge } from "mppx";
import type { ServiceDef } from "../../schemas/services.ts";
import type { HealthCheck } from "./check.ts";
import type { Evaluate, Probe } from "./http.ts";

/** Preserve proxy prefixes: /company-enrich + /v1/search. */
export function endpointUrl(base: string, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    throw new Error("Probe path must be relative to the service URL");
  }
  const url = new URL(`${base.replace(/\/$/, "")}${path}`);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Probe URL must use HTTPS without credentials");
  }
  const prefix = new URL(base);
  if (
    url.origin !== prefix.origin ||
    !url.pathname.startsWith(`${prefix.pathname.replace(/\/$/, "")}/`)
  ) {
    throw new Error("Probe path must stay within the service URL");
  }
  return url.href;
}

function inactiveReason(service: ServiceDef): string | undefined {
  return service.status === "deprecated" || service.status === "maintenance"
    ? `Service status: ${service.status}`
    : undefined;
}

export function serviceUrls(service: ServiceDef): string[] {
  return [
    ...new Set(
      [
        service.url,
        service.serviceUrl,
        ...Object.values(service.docs ?? {}),
        service.provider?.url,
      ].filter((url): url is string => Boolean(url)),
    ),
  ];
}

export const classifyUrl: Evaluate = (response) => {
  if (response.ok) return { outcome: "pass", reason: "Link reachable" };
  if ([404, 410].includes(response.status))
    return {
      outcome: "fail",
      reason: "Listed link unavailable; does not establish endpoint health",
    };
  return {
    outcome: "inconclusive",
    reason:
      "Link availability unverified: server, authentication, rate limit, or redirect response",
  };
};

export function classifyServiceUrl(
  service: ServiceDef,
  url: string,
  response: Response,
): ReturnType<Evaluate> {
  if (Object.values(service.docs ?? {}).includes(url))
    return classifyUrl(response);
  return response.status < 500
    ? {
        outcome: "pass",
        reason: "Host reachable; base URL is not a documented resource",
      }
    : {
        outcome: "inconclusive",
        reason: "Host returned a server error; availability unverified",
      };
}

export const checkUrls: HealthCheck = async (service, { probe }) => {
  const results = [];
  for (const url of serviceUrls(service)) {
    results.push(
      await probe(
        {
          followRedirects: true,
          method: "GET",
          service: service.id,
          skip: inactiveReason(service),
          target: "link",
          url,
        },
        (response) => classifyServiceUrl(service, url, response),
      ),
    );
  }
  return results;
};

export interface MppProbe extends Probe {
  payment?: { intent: string; methods: string[] };
}

export function mppProbes(service: ServiceDef): MppProbe[] {
  return service.endpoints.map((endpoint) => {
    const [method, path] = endpoint.route.split(" ");
    const fixture = endpoint.healthCheck || undefined;
    const concretePath = fixture?.path ?? path;
    const paid =
      endpoint.dynamic ||
      (endpoint.amount !== undefined && BigInt(endpoint.amount) > 0n);
    let skip =
      inactiveReason(service) ??
      (endpoint.healthCheck === false
        ? "Endpoint explicitly excluded from health probes"
        : undefined);
    if (
      !skip &&
      !["GET", "HEAD"].includes(method) &&
      !(method === "POST" && fixture)
    )
      skip =
        "Needs an explicitly safe POST fixture; other write methods are not probed";
    if (!skip && /:[A-Za-z_]|\{|\}|\*/.test(concretePath))
      skip = "Needs a concrete path fixture";
    return {
      body:
        method === "POST" && fixture
          ? JSON.stringify(fixture.body ?? {})
          : undefined,
      followRedirects: true,
      method,
      payment: paid
        ? {
            intent: endpoint.intent ?? service.intent,
            methods: [
              ...new Set(service.payments.map((payment) => payment.method)),
            ],
          }
        : undefined,
      service: service.id,
      skip,
      target: endpoint.route,
      url: endpointUrl(service.serviceUrl, concretePath),
    };
  });
}

export function classifyMpp(
  probe: MppProbe,
  response: Response,
  observedAt = Date.now(),
): ReturnType<Evaluate> {
  const status = response.status;
  if (status === 402) {
    try {
      const challenges = Challenge.fromResponseList(response);
      if (!challenges.length) throw new Error("No Challenge");
      if (
        probe.payment &&
        !challenges.some(
          (challenge) =>
            challenge.intent === probe.payment?.intent &&
            probe.payment.methods.includes(challenge.method),
        )
      ) {
        return {
          outcome: "fail",
          reason: "Challenge method/intent does not match the listing",
        };
      }
      const matching = challenges.filter(
        (challenge) =>
          !probe.payment ||
          (challenge.intent === probe.payment.intent &&
            probe.payment.methods.includes(challenge.method)),
      );
      if (
        !matching.some((challenge) => {
          if (challenge.expires) {
            const expiresAt = Date.parse(challenge.expires);
            if (!Number.isFinite(expiresAt) || expiresAt <= observedAt)
              return false;
          }
          if (
            challenge.intent !== "charge" ||
            !["tempo", "stripe"].includes(challenge.method)
          )
            return true;
          return (
            typeof challenge.request.amount === "string" &&
            /^\d+$/.test(challenge.request.amount) &&
            typeof challenge.request.currency === "string" &&
            challenge.request.currency.length > 0
          );
        })
      )
        return {
          outcome: "fail",
          reason:
            "Matching Challenges are expired or lack valid charge amount/currency fields",
        };
      return {
        outcome: "pass",
        reason:
          "Parseable MPP Challenge matches the listing; payment and fulfillment not tested",
      };
    } catch {
      return {
        outcome: "fail",
        reason: "Missing or malformed MPP WWW-Authenticate Challenge",
      };
    }
  }
  if (response.ok)
    return probe.payment
      ? {
          outcome: "inconclusive",
          reason: "Paid endpoint returned success without a Challenge",
        }
      : { outcome: "pass", reason: "Endpoint reachable" };
  if (status === 404 || status === 410)
    return {
      outcome: "fail",
      reason:
        "Listed route is missing or gone (404/410); review the route, not the whole service",
    };
  return {
    outcome: "inconclusive",
    reason:
      "Input, authentication, server, rate limit, or redirect prevents payment verification",
  };
}

export const checkMpp: HealthCheck = async (service, { probe }) => {
  const results = [];
  for (const request of mppProbes(service))
    results.push(
      await probe(request, (response) => classifyMpp(request, response)),
    );
  return results;
};
