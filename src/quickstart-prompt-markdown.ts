import {
  CLIENT_PROMPT,
  SERVER_PROMPT,
} from "./components/quickstart-prompts.js";

const CLIENT_PROMPT_COMPONENT = /<ClientPrompt\s*\/>/g;
const QUICKSTART_PROMPTS_COMPONENT = /<QuickstartPrompts\s*\/>/g;
const SERVER_PROMPT_COMPONENT = /<ServerPrompt\s*\/>/g;

export function expandQuickstartPromptComponents(markdown: string): string {
  return markdown
    .replace(QUICKSTART_PROMPTS_COMPONENT, quickstartPromptsMarkdown())
    .replace(CLIENT_PROMPT_COMPONENT, promptCodeBlock(CLIENT_PROMPT))
    .replace(SERVER_PROMPT_COMPONENT, promptCodeBlock(SERVER_PROMPT));
}

function promptCodeBlock(prompt: string): string {
  return `\`\`\`text\n${prompt.trimEnd()}\n\`\`\``;
}

function quickstartPromptsMarkdown(): string {
  return `### Client\n\n${promptCodeBlock(CLIENT_PROMPT)}\n\n### Server\n\n${promptCodeBlock(SERVER_PROMPT)}`;
}
