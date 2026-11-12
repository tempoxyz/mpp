// The services the discovery playground lists: five small paid APIs on the same Worker, each with
// its own price and request schema. The Worker publishes each one's OpenAPI document (with
// x-payment-info) from these; the page only learns about them from those documents.

/** The JSON Schema subset these services use for request bodies. */
export type Schema =
  | {
      type: "string";
      description?: string;
      enum?: readonly string[];
      minLength?: number;
      maxLength?: number;
      default?: string;
    }
  | {
      type: "integer" | "number";
      description?: string;
      minimum?: number;
      maximum?: number;
      default?: number;
    }
  | { type: "boolean"; description?: string; default?: boolean }
  | {
      type: "array";
      description?: string;
      items: { type: "string"; enum: readonly string[] };
      minItems?: number;
      maxItems?: number;
      default?: readonly string[];
    };

export type ObjectSchema = {
  type: "object";
  additionalProperties: false;
  properties: Record<string, Schema>;
  required: readonly string[];
};

export type Service = {
  slug: string;
  title: string;
  /** One line for the directory. */
  summary: string;
  categories: readonly string[];
  /** The paid operation's path, under the service's base URL. */
  path: string;
  /** The operation's OpenAPI summary. */
  operation: string;
  /** Price per call in OUSD. */
  price: string;
  request: ObjectSchema;
  /** What a successful call returns. */
  response:
    | { contentType: "application/json"; schema: Record<string, unknown> }
    | { contentType: "image/svg+xml" };
};

export const services: readonly Service[] = [
  {
    slug: "forecast",
    title: "Forecast API",
    summary: "Daily weather for any city, up to a week out.",
    categories: ["weather", "data"],
    path: "/v1/forecast",
    operation: "Forecast a city's weather",
    price: "0.002",
    request: {
      type: "object",
      additionalProperties: false,
      properties: {
        city: {
          type: "string",
          description: "City name",
          minLength: 2,
          maxLength: 40,
          default: "Lisbon",
        },
        days: {
          type: "integer",
          description: "Days to forecast",
          minimum: 1,
          maximum: 7,
          default: 3,
        },
        units: {
          type: "string",
          description: "Temperature units",
          enum: ["metric", "imperial"],
          default: "metric",
        },
      },
      required: ["city", "days"],
    },
    response: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          city: { type: "string" },
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                high: { type: "number" },
                low: { type: "number" },
                sky: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  {
    slug: "fx",
    title: "FX Quotes",
    summary: "Convert an amount between currencies at an indicative rate.",
    categories: ["finance"],
    path: "/v1/quote",
    operation: "Quote a currency conversion",
    price: "0.003",
    request: {
      type: "object",
      additionalProperties: false,
      properties: {
        from: {
          type: "string",
          description: "Currency to convert from",
          enum: ["USD", "EUR", "GBP", "MXN", "BRL", "JPY"],
          default: "USD",
        },
        to: {
          type: "string",
          description: "Currency to convert to",
          enum: ["USD", "EUR", "GBP", "MXN", "BRL", "JPY"],
          default: "MXN",
        },
        amount: {
          type: "number",
          description: "Amount to convert",
          minimum: 1,
          maximum: 1000000,
          default: 250,
        },
      },
      required: ["from", "to", "amount"],
    },
    response: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          rate: { type: "number" },
          converted: { type: "number" },
          asOf: { type: "string" },
        },
      },
    },
  },
  {
    slug: "avatar",
    title: "Avatar Studio",
    summary: "A unique SVG avatar from any seed.",
    categories: ["images", "design"],
    path: "/v1/avatar",
    operation: "Render an avatar",
    price: "0.01",
    request: {
      type: "object",
      additionalProperties: false,
      properties: {
        seed: {
          type: "string",
          description: "Any text: the same seed draws the same avatar",
          minLength: 1,
          maxLength: 40,
          default: "satoshi",
        },
        palette: {
          type: "string",
          description: "Colors to draw with",
          enum: ["sunset", "ocean", "forest", "mono"],
          default: "ocean",
        },
        size: {
          type: "integer",
          description: "Width and height in pixels",
          minimum: 64,
          maximum: 256,
          default: 128,
        },
        rounded: {
          type: "boolean",
          description: "Round the corners",
          default: true,
        },
      },
      required: ["seed"],
    },
    response: { contentType: "image/svg+xml" },
  },
  {
    slug: "text",
    title: "Text Styler",
    summary: "Restyle a line of text.",
    categories: ["text"],
    path: "/v1/style",
    operation: "Restyle text",
    price: "0.001",
    request: {
      type: "object",
      additionalProperties: false,
      properties: {
        text: {
          type: "string",
          description: "Text to restyle",
          minLength: 1,
          maxLength: 140,
          default: "machines can pay now",
        },
        style: {
          type: "string",
          description: "How to restyle it",
          enum: ["shout", "whisper", "reverse", "mock", "clap"],
          default: "clap",
        },
      },
      required: ["text", "style"],
    },
    response: {
      contentType: "application/json",
      schema: { type: "object", properties: { text: { type: "string" } } },
    },
  },
  {
    slug: "dice",
    title: "Dice Roller",
    summary: "Fair dice, rolled server-side.",
    categories: ["games"],
    path: "/v1/roll",
    operation: "Roll dice",
    price: "0.0005",
    request: {
      type: "object",
      additionalProperties: false,
      properties: {
        dice: {
          type: "array",
          description: "Dice to roll",
          items: { type: "string", enum: ["d4", "d6", "d8", "d12", "d20"] },
          minItems: 1,
          maxItems: 6,
          default: ["d20", "d6"],
        },
        modifier: {
          type: "integer",
          description: "Added to the total",
          minimum: -10,
          maximum: 10,
          default: 0,
        },
      },
      required: ["dice"],
    },
    response: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          rolls: { type: "array", items: { type: "integer" } },
          total: { type: "integer" },
        },
      },
    },
  },
];

/** Each field's default, as the page's form starts. */
export function defaults(schema: ObjectSchema): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema.properties)
      .filter(([, field]) => field.default !== undefined)
      .map(([name, field]) => [name, field.default]),
  );
}

/** Why a body doesn't match the schema, or undefined when it does. */
export function invalid(
  schema: ObjectSchema,
  body: unknown,
): string | undefined {
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return "The body must be a JSON object.";
  const input = body as Record<string, unknown>;
  for (const name of schema.required)
    if (input[name] === undefined) return `${name} is required.`;
  for (const [name, value] of Object.entries(input)) {
    // Own properties only, so keys such as constructor or __proto__ count as undeclared.
    const field = Object.hasOwn(schema.properties, name)
      ? schema.properties[name]
      : undefined;
    if (!field) return `${name} is not a field.`;
    if (field.type === "string") {
      if (typeof value !== "string") return `${name} must be a string.`;
      if (field.enum && !field.enum.includes(value))
        return `${name} must be one of ${field.enum.join(", ")}.`;
      if (field.minLength !== undefined && value.length < field.minLength)
        return `${name} is too short.`;
      if (field.maxLength !== undefined && value.length > field.maxLength)
        return `${name} is too long.`;
    } else if (field.type === "integer" || field.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value))
        return `${name} must be a number.`;
      if (field.type === "integer" && !Number.isInteger(value))
        return `${name} must be a whole number.`;
      if (field.minimum !== undefined && value < field.minimum)
        return `${name} must be at least ${field.minimum}.`;
      if (field.maximum !== undefined && value > field.maximum)
        return `${name} must be at most ${field.maximum}.`;
    } else if (field.type === "boolean") {
      if (typeof value !== "boolean") return `${name} must be true or false.`;
    } else if (field.type === "array") {
      if (!Array.isArray(value)) return `${name} must be a list.`;
      if (value.some((item) => !field.items.enum.includes(item)))
        return `${name} may only hold ${field.items.enum.join(", ")}.`;
      if (field.minItems !== undefined && value.length < field.minItems)
        return `${name} needs at least ${field.minItems}.`;
      if (field.maxItems !== undefined && value.length > field.maxItems)
        return `${name} holds at most ${field.maxItems}.`;
    }
  }
  return undefined;
}
