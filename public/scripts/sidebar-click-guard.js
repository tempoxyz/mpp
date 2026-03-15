(() => {
  if (window.__mppSidebarClickGuard) return;
  window.__mppSidebarClickGuard = { hydrated: false };

  const isPlainLeftClick = (event) =>
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;

  document.addEventListener(
    "click",
    (event) => {
      if (window.__mppSidebarClickGuard?.hydrated) return;
      if (!isPlainLeftClick(event)) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest(
        "[data-v-sidebar-container] a[data-v-sidebar-item][href]",
      );
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)) return;

      event.preventDefault();

      const startedAt = performance.now();
      const replayClick = () => {
        if (window.__mppSidebarClickGuard?.hydrated) {
          anchor.dispatchEvent(
            new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window,
            }),
          );
          return;
        }

        if (performance.now() - startedAt > 1500) {
          window.location.assign(href);
          return;
        }

        requestAnimationFrame(replayClick);
      };

      requestAnimationFrame(replayClick);
    },
    true,
  );
})();
