(() => {
  if (window.__mppSidebarHydrationGuard) return;
  window.__mppSidebarHydrationGuard = true;

  let hydrated = false;
  let pendingHref = null;

  const markHydrated = () => {
    if (hydrated) return;
    hydrated = true;
    document.documentElement.removeAttribute("data-sidebar-hydrating");

    if (!pendingHref) return;
    const href = pendingHref;
    pendingHref = null;

    const candidates = document.querySelectorAll("a[data-v-sidebar-item]");
    for (const candidate of candidates) {
      if (!(candidate instanceof HTMLAnchorElement)) continue;
      if (candidate.getAttribute("href") === href || candidate.href === href) {
        candidate.click();
        return;
      }
    }

    window.location.assign(href);
  };

  const onClick = (event) => {
    if (hydrated || event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest("a[data-v-sidebar-item]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (anchor.target && anchor.target !== "_self") return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    pendingHref = anchor.getAttribute("href") || anchor.href;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  document.documentElement.setAttribute("data-sidebar-hydrating", "true");
  document.addEventListener("click", onClick, true);
  window.addEventListener("mpp:hydrated", markHydrated, { once: true });
  setTimeout(markHydrated, 8000);
})();
