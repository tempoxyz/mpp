type PostHogEvent = {
  name: string;
  properties: Record<string, unknown>;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    posthog?: {
      __SV?: number;
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

const eventQueue: PostHogEvent[] = [];
let isProcessingQueue = false;

/**
 * Safely capture an event to PostHog.
 * Queues events if PostHog hasn't loaded yet.
 */
export function captureEvent(
  name: string,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  const event = { name, properties: { ...properties, timestamp: Date.now() } };

  if (window.posthog?.capture) {
    window.posthog.capture(event.name, event.properties);
  } else {
    eventQueue.push(event);
    processQueue();
  }
}

const MAX_QUEUE_RETRIES = 50;

function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  let retries = 0;

  const checkAndProcess = () => {
    if (window.posthog?.capture && eventQueue.length > 0) {
      for (const event of eventQueue) {
        window.posthog.capture(event.name, event.properties);
      }
      eventQueue.length = 0;
      isProcessingQueue = false;
    } else if (eventQueue.length > 0 && retries < MAX_QUEUE_RETRIES) {
      retries++;
      setTimeout(checkAndProcess, 100);
    } else {
      eventQueue.length = 0;
      isProcessingQueue = false;
    }
  };

  checkAndProcess();
}

export const AnalyticsEvents = {
  DEMO_FAUCET_CLAIMED: "mpp.demo.faucet_claimed",
  DEMO_QUERY_COMPLETED: "mpp.demo.query_completed",
  DEMO_QUERY_SELECTED: "mpp.demo.query_selected",
  DEMO_VARIANT_SELECTED: "mpp.demo.variant_selected",
  DEMO_WALLET_CONNECTED: "mpp.demo.wallet_connected",
  LANDING_AGENT_CMD_COPIED: "mpp.landing.agent_cmd_copied",
  LANDING_AGENT_TAB_SELECTED: "mpp.landing.agent_tab_selected",
  LANDING_CTA_CLICKED: "mpp.landing.cta_clicked",
  OUTBOUND_CLICK: "mpp.outbound_click",
} as const;
