"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type SectionArtwork = "services" | "network" | "belief" | "wardrobe";
type Section = { element: HTMLElement; artwork: SectionArtwork; colour: string };

// This lives inside the native artwork layer, so the Matrix's existing reveal
// and the glasses' electric treatment continue to take precedence over it.
export default function HeaderFeatureSectionArtwork({ imageUrl }: { imageUrl: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    const native = root?.closest<HTMLElement>("[data-header-feature-image-native]");
    const feature = root?.closest<HTMLElement>("[data-header-feature-root]");
    const header = root?.closest<HTMLElement>("#site-header-root");
    if (!root || !native || !feature) return;

    gsap.registerPlugin(ScrollTrigger);
    const desktop = matchMedia("(min-width: 1280px)");
    let sections: Section[] = [];
    let scrollContent: HTMLElement | null = null;
    let lastTransform = "";
    let lastScroll = -1, settleUntil = 0;
    let current = "";
    const imageArtwork = {
      services: root.querySelector<HTMLElement>("[data-header-section-matcha]"),
      wardrobe: root.querySelector<HTMLElement>("[data-header-section-hat]"),
    };
    const images = Object.values(imageArtwork).filter((image): image is HTMLElement => !!image);
    const imageFor = (artwork?: string) => imageArtwork[artwork as keyof typeof imageArtwork];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let artworkTween: gsap.core.Timeline | undefined;
    let ctaActive = !!document.querySelector('[data-project-cta-sky-portal][data-active="true"]');

    const setArtwork = (section?: Section) => {
      const next = section?.artwork || "default";
      if (next === current) return;
      current = next;
      artworkTween?.kill();
      const previousImage = imageFor(native.dataset.sectionArtwork);
      const nextImage = imageFor(next);
      const apply = () => {
        native.dataset.sectionArtwork = next;
        native.dataset.sectionImage = String(!!nextImage);
        feature.dataset.headerSectionArtwork = next;
        native.style.setProperty("--header-section-star-colour", section?.colour || "transparent");
        if (nextImage) {
          // All photographic nav objects stay upright, including a star's
          // in-progress hover spin when the section changes underneath it.
          gsap.killTweensOf(native);
          gsap.set(native, { rotation: 0, scaleX: 1, scaleY: 1 });
        }
      };
      if (reduced.matches) {
        apply();
        gsap.set(images, { clearProps: "transform,opacity,visibility" });
        return;
      }
      artworkTween = gsap.timeline();
      if (previousImage && previousImage !== nextImage) {
        artworkTween.to(previousImage, { scale: 0, autoAlpha: 0, duration: 0.16, ease: "back.in(1.2)" });
      }
      artworkTween.call(() => {
        apply();
        gsap.set(images.filter(image => image !== nextImage), { clearProps: "transform,opacity,visibility" });
        if (nextImage && previousImage !== nextImage) gsap.set(nextImage, { scale: 0, autoAlpha: 0 });
      });
      if (nextImage) {
        artworkTween.to(nextImage, { scale: 1, autoAlpha: 1, duration: 0.32, ease: "back.out(1.8)" })
          .set(nextImage, { clearProps: "transform,opacity,visibility" });
      }
    };
    const discover = () => {
      sections = [];
      scrollContent = document.getElementById("smooth-content");
      const services = document.querySelector<HTMLElement>("[data-what-grid]");
      const network = document.querySelector("[data-network-intro]")?.closest("section");
      const belief = document.querySelector<HTMLElement>("[data-belief-section]");
      const wardrobe = document.getElementById("what-we-are");
      if (services) {
        const heading = services.querySelector<HTMLElement>("[data-what-heading]");
        const colour = heading ? getComputedStyle(heading).getPropertyValue("--what-accent").trim() : "";
        sections.push({ element: services, artwork: "services", colour: colour || "#ff00f7" });
      }
      if (network) sections.push({ element: network, artwork: "network", colour: "#fff" });
      if (belief) {
        const bubble = belief.querySelector<HTMLElement>(".caption-bubble");
        sections.push({ element: belief, artwork: "belief", colour: bubble ? getComputedStyle(bubble).backgroundColor : "#627aff" });
      }
      if (wardrobe) sections.push({ element: wardrobe, artwork: "wardrobe", colour: "transparent" });
      settleUntil = performance.now() + 1400;
    };
    const update = () => {
      if (!desktop.matches || pathname !== "/" || ctaActive) {
        setArtwork();
        return;
      }
      const now = performance.now();
      const scroll = window.scrollY;
      const transform = scrollContent?.style.transform || "";
      // Follow ScrollSmoother's settling motion, but do no layout reads at rest.
      if (scroll !== lastScroll || transform !== lastTransform) {
        lastScroll = scroll;
        lastTransform = transform;
        settleUntil = now + 1400;
      }
      if (now > settleUntil) return;
      // Select the incoming artwork early, but its complementary exit mask
      // keeps it hidden until the section seam actually reaches the nav.
      if (header?.dataset.headerVisualMode === "matrix" &&
          Number(header.style.getPropertyValue("--header-matrix-boundary")) > 0) {
        setArtwork(sections.find(section => section.artwork === "network"));
        return;
      }
      const bounds = feature.getBoundingClientRect();
      if (!bounds.height) return;
      const navY = bounds.top + bounds.height / 2;
      const section = sections.find(({ element }) => {
        if (!element.isConnected || element.closest("[inert]")) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= navY && rect.bottom > navY;
      });
      setArtwork(section);
    };
    const refresh = () => { discover(); update(); };
    const scrollChanged = () => { settleUntil = performance.now() + 1400; };
    const ctaChanged = (event: Event) => {
      ctaActive = (event as CustomEvent<{ active: boolean }>).detail.active;
      scrollChanged();
      update();
    };
    setArtwork();
    if (pathname !== "/") return;

    // The streamed homepage can arrive after the persistent header mounts.
    // Stop observing once all four sections have arrived.
    const observer = new MutationObserver(() => {
      discover();
      if (sections.length === 4) observer.disconnect();
    });
    discover();
    if (sections.length < 4) observer.observe(document.body, { childList: true, subtree: true });
    gsap.ticker.add(update);
    ScrollTrigger.addEventListener("refresh", refresh);
    desktop.addEventListener("change", refresh);
    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("initial-hash-ready", refresh);
    window.addEventListener("app:project-cta-active", ctaChanged);
    // Native focus/scrollIntoView can scroll a wrapper without moving window.
    document.addEventListener("scroll", scrollChanged, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      gsap.ticker.remove(update);
      ScrollTrigger.removeEventListener("refresh", refresh);
      desktop.removeEventListener("change", refresh);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("initial-hash-ready", refresh);
      window.removeEventListener("app:project-cta-active", ctaChanged);
      document.removeEventListener("scroll", scrollChanged, true);
      delete native.dataset.sectionArtwork;
      delete native.dataset.sectionImage;
      delete feature.dataset.headerSectionArtwork;
      artworkTween?.kill();
      gsap.set(images, { clearProps: "transform,opacity,visibility" });
      native.style.removeProperty("--header-section-star-colour");
    };
  }, [pathname]);

  return (
    <span ref={rootRef} data-header-section-artwork aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span data-header-section-star className="absolute inset-0" style={{ "--header-star-mask": `url("${imageUrl}")` } as CSSProperties} />
      <span data-header-section-matcha data-header-section-image className="absolute inset-0" />
      <span data-header-section-network className="absolute inset-0" />
      <span data-header-section-hat data-header-section-image className="absolute inset-0" />
    </span>
  );
}
