"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Snippet from https://us.posthog.com/project/settings/snippet
const POSTHOG_SNIPPET = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetGroupPropertiesForFlags setGroupPropertiesForFlags resetPersonPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('phc_aNlTw2xAUQKd9zTovXeYheEUpQpEhplehCK5r1e31HR',{api_host:'https://us.i.posthog.com',disable_session_recording:true});`;

function usePostHog() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (window.posthog?.__SV) return;

    const inject = () => new Function(POSTHOG_SNIPPET)();

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(inject);
    } else {
      setTimeout(inject, 50);
    }
  }, []);
}

const NAV_LINKS = [
  { text: "Docs", href: "/overview" },
  { text: "Services", href: "/services" },
  {
    text: "Specification",
    href: "https://tempoxyz.github.io/mpp-specs/",
    external: true,
  },
  {
    text: "GitHub",
    items: [
      {
        text: "mppx (TypeScript)",
        href: "https://github.com/wevm/mppx",
      },
      {
        text: "mpp-rs (Rust)",
        href: "https://github.com/tempoxyz/mpp-rs",
      },
      {
        text: "pympp (Python)",
        href: "https://github.com/tempoxyz/pympp",
      },
      {
        text: "Specification",
        href: "https://github.com/tempoxyz/mpp-specs",
      },
    ],
  },
] as const;

function MobileNav() {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <nav data-mobile-nav="" aria-label="Main navigation">
      {NAV_LINKS.map((link) =>
        "items" in link ? (
          <div key={link.text}>
            <button
              type="button"
              data-mobile-nav-item=""
              onClick={() =>
                setExpandedGroup(expandedGroup === link.text ? null : link.text)
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span>{link.text}</span>
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform:
                    expandedGroup === link.text
                      ? "rotate(180deg)"
                      : "rotate(0)",
                  transition: "transform 0.15s",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expandedGroup === link.text && (
              <div data-mobile-nav-subitems="">
                {link.items.map((sub) => (
                  <a
                    key={sub.href}
                    href={sub.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-mobile-nav-subitem=""
                  >
                    {sub.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <a
            key={link.text}
            href={link.href}
            data-mobile-nav-item=""
            {...("external" in link
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {link.text}
          </a>
        ),
      )}
    </nav>
  );
}

function MobileNavPortal() {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    const find = () => {
      const sidebar = document.querySelector("[data-v-sidebar]");
      if (sidebar) {
        setTarget(sidebar);
        return;
      }
      setTimeout(find, 200);
    };
    find();
  }, []);

  if (!target) return null;
  return createPortal(<MobileNav />, target);
}

export default function Layout(props: React.PropsWithChildren) {
  usePostHog();

  return (
    <>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1"
      />
      <MobileNavPortal />
      {props.children}
    </>
  );
}
