import {
  ARTICLE_SUMMARIES,
  CHAT_RESPONSES,
  IMAGE_RESULTS,
  POEM_RESULTS,
  SEARCH_RESULTS,
} from "./terminal-data";

// ---------------------------------------------------------------------------
// Step DSL types
// ---------------------------------------------------------------------------

export type PaymentStepConfig = {
  type: "tempo-charge" | "tempo-session" | "stripe";
  label: string;
  description?: string;
  endpoint: string;
  liveEndpoint?: (input: string) => string;
  methodLabel: string;
  cost: number | ((output: string[]) => number);
  prompt?: { label: string; placeholder: string; prefix?: string };
  skipPrompt?: boolean;
  pickOutput?: () => string[];
  outputMode?: "text" | "photo" | "gallery";
};

export type CommandsStepConfig = {
  type: "commands";
  commands: string[];
};

export type WizardStepConfig = {
  type: "wizard";
  options: PaymentStepConfig[];
};

export type StepConfig =
  | PaymentStepConfig
  | CommandsStepConfig
  | WizardStepConfig;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const COST_PER_TOKEN = 0.0001;
export const LOOKUP_COST = 1.0;

// ---------------------------------------------------------------------------
// Shuffle & cyclic picker helpers
// ---------------------------------------------------------------------------

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createCyclicPicker<T>(items: T[], first?: T): () => T {
  let queue = first
    ? [first, ...shuffle(items.filter((i) => i !== first))]
    : shuffle(items);
  let index = 0;
  return () => {
    if (index >= queue.length) {
      queue = shuffle(items);
      index = 0;
    }
    return queue[index++];
  };
}

export const pickChat = createCyclicPicker(CHAT_RESPONSES);
export const pickImage = createCyclicPicker(IMAGE_RESULTS);
export const pickPoem = createCyclicPicker(POEM_RESULTS);
export const pickSearch = createCyclicPicker(SEARCH_RESULTS);
export const pickArticle = createCyclicPicker(ARTICLE_SUMMARIES);

// ---------------------------------------------------------------------------
// Step DSL builder functions
// ---------------------------------------------------------------------------

export function commands(cmds: string[]): CommandsStepConfig {
  return { type: "commands", commands: cmds };
}

export function wizard(options: PaymentStepConfig[]): WizardStepConfig {
  return { type: "wizard", options };
}

export function charge({
  label,
  description,
  endpoint,
  liveEndpoint,
  cost,
  prompt,
  skipPrompt,
  pickOutput,
  outputMode,
}: {
  label: string;
  description?: string;
  endpoint: string;
  liveEndpoint?: (input: string) => string;
  cost: number;
  prompt?: { label: string; placeholder: string; prefix?: string };
  skipPrompt?: boolean;
  pickOutput?: () => string[];
  outputMode?: "text" | "photo" | "gallery";
}): PaymentStepConfig {
  return {
    type: "tempo-charge",
    label,
    description,
    endpoint,
    liveEndpoint,
    methodLabel: "Tempo charge",
    cost,
    prompt,
    skipPrompt,
    pickOutput,
    outputMode,
  };
}

export function session({
  label,
  description,
  endpoint,
  liveEndpoint,
  cost,
  prompt,
  skipPrompt,
  pickOutput,
  outputMode,
}: {
  label: string;
  description?: string;
  endpoint: string;
  liveEndpoint?: (input: string) => string;
  cost?: (output: string[]) => number;
  prompt?: { label: string; placeholder: string; prefix?: string };
  skipPrompt?: boolean;
  pickOutput?: () => string[];
  outputMode?: "text" | "photo" | "gallery";
}): PaymentStepConfig {
  return {
    type: "tempo-session",
    label,
    description,
    endpoint,
    liveEndpoint,
    methodLabel: "Tempo session",
    cost:
      cost ??
      ((output) => Math.ceil(output.join("\n").length / 4) * COST_PER_TOKEN),
    prompt,
    skipPrompt,
    pickOutput,
    outputMode,
  };
}

export function stripe({
  label,
  description,
  endpoint,
  liveEndpoint,
  cost,
  prompt,
  skipPrompt,
  pickOutput,
  outputMode,
}: {
  label: string;
  description?: string;
  endpoint: string;
  liveEndpoint?: (input: string) => string;
  cost: number;
  prompt?: { label: string; placeholder: string; prefix?: string };
  skipPrompt?: boolean;
  pickOutput?: () => string[];
  outputMode?: "text" | "photo" | "gallery";
}): PaymentStepConfig {
  return {
    type: "stripe",
    label,
    description,
    endpoint,
    liveEndpoint,
    methodLabel: "Stripe charge",
    cost,
    prompt,
    skipPrompt,
    pickOutput,
    outputMode,
  };
}

// ---------------------------------------------------------------------------
// Preset step builders
// ---------------------------------------------------------------------------

export function chat(): PaymentStepConfig {
  return {
    ...session({
      label: "Chat with OpenAI",
      description: "Chat with AI and pay per token streamed",
      endpoint: "/api/chat",
      liveEndpoint: (input) =>
        `/api/demo/chat?prompt=${encodeURIComponent(input)}`,
      prompt: {
        label: "Enter prompt",
        placeholder: "what are micropayments?",
      },
      pickOutput: pickChat,
    }),
    methodLabel: "Tempo",
  };
}

export function image(): PaymentStepConfig {
  return {
    ...charge({
      label: "Generate an image using fal.ai",
      description: "Generate an image and pay per request",
      endpoint: "/api/image",
      liveEndpoint: (input) =>
        `/api/demo/image?prompt=${encodeURIComponent(input)}`,
      cost: 0.003,
      prompt: {
        label: "Enter prompt",
        placeholder: "a neon cityscape at night",
      },
      pickOutput: pickImage,
      outputMode: "photo",
    }),
    methodLabel: "Tempo",
  };
}

export function search(): PaymentStepConfig {
  return {
    ...charge({
      label: "Search the web using Parallel",
      description: "Search the web and pay per query",
      endpoint: "/api/search",
      liveEndpoint: (input) =>
        `/api/demo/search?query=${encodeURIComponent(input)}`,
      cost: 0.005,
      prompt: { label: "Enter query", placeholder: "Machine Payments" },
      pickOutput: pickSearch,
    }),
    methodLabel: "Tempo",
  };
}

export function article(): PaymentStepConfig {
  return {
    ...stripe({
      label: "Summarize an article using Parallel",
      description: "Summarize an article and pay with Stripe",
      endpoint: "/api/article",
      liveEndpoint: (input) =>
        `/api/demo/article?url=${encodeURIComponent(input)}`,
      cost: LOOKUP_COST,
      prompt: {
        label: "Enter URL",
        placeholder: "stratechery.com/2025/the-agentic-web-and-original-sin/",
        prefix: "https://",
      },
      pickOutput: pickArticle,
    }),
    methodLabel: "Stripe",
  };
}

export function poem(): PaymentStepConfig {
  return session({
    label: "Write poem",
    description: "Write a poem and pay per token streamed",
    endpoint: "/api/sessions/poem",
    liveEndpoint: (input) =>
      `/api/demo/poem?prompt=${encodeURIComponent(input)}`,
    prompt: { label: "Enter prompt", placeholder: "what are micropayments?" },
    skipPrompt: true,
    pickOutput: pickPoem,
  });
}

export function ascii(): PaymentStepConfig {
  return charge({
    label: "Create ASCII art",
    description: "Create ASCII art and pay per request",
    endpoint: "/api/ascii",
    liveEndpoint: (input) =>
      `/api/demo/ascii?prompt=${encodeURIComponent(input)}`,
    cost: 0.001,
    skipPrompt: true,
    pickOutput: pickImage,
  });
}

export function lookup(): PaymentStepConfig {
  return stripe({
    label: "Lookup company",
    description: "Look up a company and pay with Stripe",
    endpoint: "/api/lookup",
    liveEndpoint: (input) =>
      `/api/demo/lookup?url=${encodeURIComponent(input)}`,
    cost: LOOKUP_COST,
    prompt: {
      label: "Enter URL",
      placeholder: "stratechery.com/2025/the-agentic-web-and-original-sin/",
      prefix: "https://",
    },
    pickOutput: pickArticle,
  });
}

export function ping(): PaymentStepConfig {
  return charge({
    label: "Ping",
    description: "Ping a paid endpoint",
    endpoint: "/api/ping/paid",
    cost: 0.001,
    skipPrompt: true,
    pickOutput: () => ["pong"],
  });
}

export function photo(): PaymentStepConfig {
  return charge({
    label: "Photo",
    description: "Fetch a photo and pay per request",
    endpoint: "/api/photo",
    cost: 0.01,
    skipPrompt: true,
    pickOutput: () => ["https://picsum.photos/seed/mpp-demo/400/400"],
    outputMode: "photo",
  });
}

export function gallery(): PaymentStepConfig {
  return session({
    label: "Generate gallery",
    description: "Generate a photo gallery and pay per image",
    endpoint: "/api/sessions/photo",
    cost: (output) => output.length * 0.01,
    skipPrompt: true,
    pickOutput: () =>
      Array.from(
        { length: 5 },
        (_, i) => `https://picsum.photos/seed/mpp-gallery-${i}/200/200`,
      ),
    outputMode: "gallery",
  });
}
