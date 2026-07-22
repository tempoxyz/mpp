"use client";

import { Tabs } from "@base-ui/react/tabs";
import { PromptBlock } from "./PromptBlock";
import { CLIENT_PROMPT, SERVER_PROMPT } from "./quickstart-prompts.js";

export { CLIENT_PROMPT, SERVER_PROMPT } from "./quickstart-prompts.js";

export function ClientPrompt() {
  return <PromptBlock>{CLIENT_PROMPT}</PromptBlock>;
}

export function ServerPrompt() {
  return <PromptBlock>{SERVER_PROMPT}</PromptBlock>;
}

export function QuickstartPrompts() {
  return (
    <Tabs.Root data-v-code-container data-v-code-group defaultValue="client">
      <Tabs.List
        aria-label="Code group"
        data-v-code-header
        data-v-code-group-list
      >
        <Tabs.Tab data-title="Client" data-v-code-group-tab value="client">
          Client
        </Tabs.Tab>
        <Tabs.Tab data-title="Server" data-v-code-group-tab value="server">
          Server
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel
        className="vocs:*:rounded-t-none vocs:*:border-t-0 vocs:*:my-0"
        data-v-code-group-panel
        value="client"
      >
        <ClientPrompt />
      </Tabs.Panel>
      <Tabs.Panel
        className="vocs:*:rounded-t-none vocs:*:border-t-0 vocs:*:my-0"
        data-v-code-group-panel
        value="server"
      >
        <ServerPrompt />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
