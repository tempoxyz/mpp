"use client";

import { Tabs } from "@base-ui/react/tabs";
import { code, withMarkdown } from "./markdown";
import { PromptBlock } from "./PromptBlock";

export const CLIENT_PROMPT = `Reference https://mpp.dev/quickstart/client.md

Add mppx to my app as a client.
Polyfill the global fetch to automatically handle 402 Payment Required responses using the Tempo payment method.
Make a request to https://mpp.dev/api/ping/paid to test.`;

export const SERVER_PROMPT = `Reference https://mpp.dev/quickstart/server.md

Add mppx to my server with a /api/test route that charges $0.01 per request using the Tempo payment method with USDC.e.
Use the mppx CLI to test your endpoint.`;

export const ClientPrompt = withMarkdown(
  function ClientPrompt() {
    return <PromptBlock>{CLIENT_PROMPT}</PromptBlock>;
  },
  () => code(CLIENT_PROMPT),
);

export const ServerPrompt = withMarkdown(
  function ServerPrompt() {
    return <PromptBlock>{SERVER_PROMPT}</PromptBlock>;
  },
  () => code(SERVER_PROMPT),
);

export const QuickstartPrompts = withMarkdown(
  function QuickstartPrompts() {
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
  },
  () => [
    {
      children: [{ type: "text", value: "Client" }],
      depth: 3,
      type: "heading",
    },
    code(CLIENT_PROMPT),
    {
      children: [{ type: "text", value: "Server" }],
      depth: 3,
      type: "heading",
    },
    code(SERVER_PROMPT),
  ],
);
