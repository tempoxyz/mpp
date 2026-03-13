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

function useGoogleAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!id) return;
    if (document.querySelector(`script[src*="googletagmanager"]`)) return;

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", id);
  }, []);
}

function MobileNav() {
  return (
    <nav data-mobile-nav="" aria-label="Main navigation">
      <a href="/overview" data-mobile-nav-item="">
        Docs
      </a>
      <a href="/services" data-mobile-nav-item="">
        Services
      </a>
      <a
        href="https://tempoxyz.github.io/mpp-specs/"
        target="_blank"
        rel="noopener noreferrer"
        data-mobile-nav-item=""
      >
        Specification
      </a>
      <span data-mobile-nav-label="">GitHub</span>
      <div data-mobile-nav-subitems="" data-mobile-nav-flat="">
        <a
          href="https://github.com/wevm/mppx"
          target="_blank"
          rel="noopener noreferrer"
          data-mobile-nav-subitem=""
        >
          mppx (TypeScript)
        </a>
        <a
          href="https://github.com/tempoxyz/mpp-rs"
          target="_blank"
          rel="noopener noreferrer"
          data-mobile-nav-subitem=""
        >
          mpp-rs (Rust)
        </a>
        <a
          href="https://github.com/tempoxyz/pympp"
          target="_blank"
          rel="noopener noreferrer"
          data-mobile-nav-subitem=""
        >
          pympp (Python)
        </a>
      </div>

      {/* Docs section label */}
      <span data-mobile-nav-label="">Docs</span>
    </nav>
  );
}

function MobileNavPortal() {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    const update = () => {
      const path = window.location.pathname;
      if (path !== "/" && path !== "/services") {
        setTarget(null);
        return;
      }
      const sidebar = document.querySelector("[data-v-sidebar]");
      if (sidebar?.isConnected) {
        setTarget((prev) => (prev === sidebar ? prev : sidebar));
      } else {
        setTarget(null);
      }
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!target || !target.isConnected) return null;
  return createPortal(<MobileNav />, target);
}

export default function Layout(props: React.PropsWithChildren) {
  usePostHog();
  useGoogleAnalytics();

  const ahrefsKey = import.meta.env.VITE_AHREFS_VERIFICATION;

  return (
    <>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1"
      />
      {ahrefsKey && (
        <meta name="ahrefs-site-verification" content={ahrefsKey} />
      )}
      <link
        rel="preload"
        href="/fonts/VTCDuBoisTrial-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/VTCDuBoisTrial-Bold.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <MobileNavPortal />
      {props.children}
    </>
  );
}
