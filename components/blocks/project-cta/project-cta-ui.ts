// Preserve the navigation's normal measurements while its type and bevels change.
// This also keeps the retro controls available when moving from the window to nav.
export function createProjectCtaUi() {
  const root = document.documentElement;
  let active = false;
  let controls: HTMLElement[] = [];
  const measure = () => {
    delete root.dataset.projectCtaUi;
    controls = Array.from(document.querySelectorAll<HTMLElement>("#site-header-root [data-right-nav-item]"));
    controls.forEach((control) => {
      control.style.setProperty("--retro-nav-width", `${control.offsetWidth}px`);
    });
    if (active) root.dataset.projectCtaUi = "true";
  };
  const resize = () => { if (active) measure(); };
  window.addEventListener("resize", resize, { passive: true });
  return {
    setActive(next: boolean) {
      if (next === active) return;
      active = next;
      if (next) measure();
      else delete root.dataset.projectCtaUi;
    },
    dispose() {
      active = false;
      delete root.dataset.projectCtaUi;
      controls.forEach((control) => control.style.removeProperty("--retro-nav-width"));
      window.removeEventListener("resize", resize);
    },
  };
}
