"use client";

import { Tabs } from "@base-ui/react/tabs";

export const CLIENT_PROMPT = `Reference https://mpp.dev/quickstart/client.md
Add mppx to my app as a client. Polyfill the global fetch to automatically 
handle 402 Payment Required responses using the Tempo payment method. 
Make a request to https://mpp.dev/api/ping/paid to test`;

export const SERVER_PROMPT = `Reference https://mpp.dev/quickstart/server.md
Add mppx to my server with a /api/test route that charges $0.01 per 
request using the Tempo payment method with USDC. 
Use the mppx CLI to test your endpoint`;

function CodeBlock({ children }: { children: string }) {
  return (
    <div data-v-code-container>
      <pre className="vocs:relative vocs:group/code" data-v>
        <code className="language-txt">{children}</code>
      </pre>
    </div>
  );
}

export function ClientPrompt() {
  return <CodeBlock>{CLIENT_PROMPT}</CodeBlock>;
}

export function ServerPrompt() {
  return <CodeBlock>{SERVER_PROMPT}</CodeBlock>;
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
        className="vocs:*:rounded-t-none vocs:*:border-t-0"
        data-v-code-group-panel
        value="client"
      >
        <ClientPrompt />
      </Tabs.Panel>
      <Tabs.Panel
        className="vocs:*:rounded-t-none vocs:*:border-t-0"
        data-v-code-group-panel
        value="server"
      >
        <ServerPrompt />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
