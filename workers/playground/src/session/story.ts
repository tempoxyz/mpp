// Writes the story: a small model writes a short one, or a built-in story stands in.
export type Env = {
  /** Workers AI binding. */
  AI?: { run(model: string, input: unknown): Promise<unknown> } | undefined;
};

/** Workers AI model: small and fast. */
export const model = "@cf/meta/llama-3.2-3b-instruct";

/** Most words a story streams, so one story can't drain a deposit. */
export const maxWords = 80;

/** How long the model may take before the built-in story is used. */
const modelTimeoutMs = 8_000;

const subjects = [
  "a lighthouse keeper who counts ships",
  "a robot that sells lemonade",
  "a cat who runs a night market",
  "a postman on the moon",
  "a baker who pays in songs",
  "a river that keeps receipts",
];

/** Writes a story about the topic (or a random subject) and splits it into words. */
export async function write(parameters: {
  env: Env;
  topic?: string | undefined;
}): Promise<string[]> {
  const { env, topic } = parameters;
  const subject =
    topic ?? subjects[Math.floor(Math.random() * subjects.length)]!;
  // The buyer already opened a session: a model outage falls back to a built-in story.
  const text = env.AI
    ? await Promise.race([
        env.AI.run(model, {
          max_tokens: 160,
          messages: [
            {
              content:
                "You write one very short story of 50 to 70 words in plain words. No title, no quotes, no explanation.",
              role: "system",
            },
            {
              content: `Write a very short story about ${subject}.`,
              role: "user",
            },
          ],
          temperature: 0.9,
        }).then((result) => (result as { response?: string }).response),
        new Promise<undefined>((resolve) =>
          setTimeout(resolve, modelTimeoutMs),
        ),
      ]).catch(() => undefined)
    : undefined;
  const words = (text?.trim() || fallback).split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords);
}

const fallback =
  "Every morning the river opened a small tab at the bakery. A loaf, a song, a little sunlight: each cost a coin so small no one noticed it fall. By evening the river closed the tab, paid exactly what it owed, and carried the change back downstream, where the fish were waiting to spend it.";
