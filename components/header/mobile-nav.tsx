"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { Menu, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SETTINGS_QUERYResult, NAVIGATION_QUERYResult } from "@/sanity.types";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import { ModeToggle } from "@/components/menu-toggle";
import {
  useHeaderNavOverrides,
  type NavLinkLite,
} from "@/components/header/nav-overrides";

type NavigationDoc = NAVIGATION_QUERYResult[0];

type AnchorLinkExtra = {
  linkType: "anchor-link";
  anchorId?: string | null;
  anchorOffsetPercent?: number | null;
};

type BtnVariant =
  | "link"
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "underline"
  | "menu"
  | "icon";

function getAnchorData(navItem: NavLinkLite): AnchorLinkExtra | null {
  if (navItem.linkType !== "anchor-link") return null;
  return {
    linkType: "anchor-link",
    anchorId: navItem.anchorId ?? null,
    anchorOffsetPercent: navItem.anchorOffsetPercent ?? null,
  };
}

function normalizeAnchorHref(rawHref: string) {
  const h = (rawHref ?? "").trim();
  if (!h) return h;
  if (h.startsWith("/")) return h;
  if (h.startsWith("#")) return `/${h}`;
  if (!h.includes("#") && !h.includes("/")) return `/#${h}`;
  return h;
}

function dispatchAnchorNavigate(anchorId: string, offsetPercent?: number | null) {
  try {
    window.dispatchEvent(
      new CustomEvent("app:anchor-navigate", {
        detail: { anchorId, offsetPercent, href: `/#${anchorId}` },
      })
    );
  } catch { }
}

export default function MobileNav({
  navigation,
  settings,
}: {
  navigation: NAVIGATION_QUERYResult;
  settings: SETTINGS_QUERYResult;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isMemeBoothRoute = !!pathname?.startsWith("/meme-booth");
  const { overrides } = useHeaderNavOverrides();
  const readyToInitialize = !isMemeBoothRoute || overrides !== null;

  const navDoc: NavigationDoc | undefined = navigation?.[0];

  const defaultTopLinks: NavLinkLite[] = useMemo(
    () => (navDoc?.leftLinks ?? []) as unknown as NavLinkLite[],
    [navDoc]
  );

  const defaultBottomLinks: NavLinkLite[] = useMemo(
    () => (navDoc?.rightLinks ?? []) as unknown as NavLinkLite[],
    [navDoc]
  );

  const topLinks: NavLinkLite[] = useMemo(() => {
    const replace = overrides?.mobileTopReplace ?? null;
    if (isMemeBoothRoute && replace && replace.length) return replace;
    return defaultTopLinks;
  }, [defaultTopLinks, isMemeBoothRoute, overrides?.mobileTopReplace]);

  const showBottomLinks = useMemo(() => {
    if (!isMemeBoothRoute) return true;
    return overrides?.showMobileBottomLinks ?? true;
  }, [isMemeBoothRoute, overrides?.showMobileBottomLinks]);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((p) => !p), []);

  const handleAnchorActivate = useCallback(
    (e: React.MouseEvent, navItem: NavLinkLite) => {
      const anchor = getAnchorData(navItem);
      if (!anchor?.anchorId) return;

      e.preventDefault();
      e.stopPropagation();
      closeMenu();

      // On home: fade/teleport
      dispatchAnchorNavigate(anchor.anchorId, anchor.anchorOffsetPercent);
    },
    [closeMenu]
  );

  /* ---------------- ICON SWAP (NO FOUC) ---------------- */

  const [icon, setIcon] = useState<"menu" | "close">("menu");
  const iconWrapRef = useRef<HTMLSpanElement | null>(null);
  const currentIconRef = useRef<"menu" | "close">("menu");
  const outTweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    if (!iconWrapRef.current) return;
    gsap.set(iconWrapRef.current, {
      scale: 1,
      opacity: 1,
      transformOrigin: "50% 50%",
    });
  }, []);

  useEffect(() => {
    const el = iconWrapRef.current;
    if (!el) return;

    const next: "menu" | "close" = open ? "close" : "menu";
    if (next === currentIconRef.current) return;

    outTweenRef.current?.kill();
    outTweenRef.current = gsap.to(el, {
      duration: 0.28,
      scale: 0,
      opacity: 0,
      ease: "elastic.in(1, 1)",
      overwrite: "auto",
      onComplete: () => {
        currentIconRef.current = next;
        setIcon(next);
      },
    });

    return () => {
      outTweenRef.current?.kill();
      outTweenRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    const el = iconWrapRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { scale: 0, opacity: 0 },
      {
        duration: 0.42,
        scale: 1,
        opacity: 1,
        ease: "elastic.out(1, 1)",
        overwrite: "auto",
      }
    );
  }, [icon]);

  /* ---------------- OVERLAY + GSAP ---------------- */

  const shellRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const resetToClosed = useCallback(() => {
    const shell = shellRef.current;
    const bg = bgRef.current;
    const panel = panelRef.current;
    if (!shell || !bg || !panel) return;

    const items = gsap.utils.toArray<HTMLElement>(
      shell.querySelectorAll("[data-mobile-nav-item]")
    );

    gsap.set(shell, { visibility: "hidden", pointerEvents: "none" });
    gsap.set(bg, { autoAlpha: 0 });
    gsap.set(panel, { scaleY: 0, transformOrigin: "top center" });
    gsap.set(items, {
      autoAlpha: 0,
      scale: 0.9,
      y: 10,
      transformOrigin: "center center",
    });
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    resetToClosed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (!readyToInitialize) {
      tlRef.current?.kill();
      tlRef.current = null;
      resetToClosed();
      return;
    }

    const shell = shellRef.current;
    const bg = bgRef.current;
    const panel = panelRef.current;
    if (!shell || !bg || !panel) return;

    const items = gsap.utils.toArray<HTMLElement>(
      shell.querySelectorAll("[data-mobile-nav-item]")
    );

    tlRef.current?.kill();
    tlRef.current = null;

    if (open) {
      gsap.set(shell, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(bg, { autoAlpha: 0 });
      gsap.set(panel, { scaleY: 0, transformOrigin: "top center" });
      gsap.set(items, { autoAlpha: 0, scale: 0.9, y: 10 });

      const tl = gsap
        .timeline({ defaults: { overwrite: "auto" } })
        .to(bg, { duration: 0.2, autoAlpha: 1, ease: "power1.out" }, 0)
        .to(panel, { duration: 0.25, scaleY: 1, ease: "power2.out" }, 0.05)
        .to(
          items,
          {
            duration: 0.6,
            autoAlpha: 1,
            scale: 1,
            y: 0,
            stagger: 0.06,
            ease: "elastic.out(1, 1)",
          },
          0.12
        );

      tlRef.current = tl;
    } else {
      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => resetToClosed(),
      });

      tl.to(items, {
        duration: 0.35,
        autoAlpha: 0,
        scale: 0.9,
        y: 10,
        stagger: { each: 0.03, from: "end" },
        ease: "power2.inOut",
      });
      tl.to(panel, { duration: 0.18, scaleY: 0, ease: "power2.inOut" }, "-=0.08");
      tl.to(bg, { duration: 0.14, autoAlpha: 0, ease: "power1.inOut" }, "-=0.10");

      tlRef.current = tl;
    }

    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, [open, mounted, readyToInitialize, resetToClosed]);

  /* ---------------- LINK RENDER ---------------- */

  const mobileTextBump = "text-xl md:text-sm";

  const isBgButton = (navItem: NavLinkLite) =>
    !!(navItem as any)?.backgroundImageEnabled &&
    ((navItem as any)?.backgroundImages?.length ?? 0) > 0;

  const getVariant = (navItem: NavLinkLite): BtnVariant => {
    const v = (navItem as any)?.buttonVariant as BtnVariant | null | undefined;
    return v ?? "underline";
  };

  const baseItemClass = cn(
    "transition-colors hover:text-foreground/90 text-foreground/70",
    "inline-flex items-center justify-center",
    "bg-transparent hover:bg-transparent",
    "whitespace-nowrap"
  );

  const pillItemClass = cn(baseItemClass, "h-8 px-3 rounded-full", mobileTextBump);

  const bgItemClass = cn(
    baseItemClass,
    "h-auto px-0 py-0 rounded-none",
    "w-full",
    mobileTextBump
  );

  const renderLinkItem = (navItem: NavLinkLite) => {
    const variant = getVariant(navItem);
    const hasBg = isBgButton(navItem);

    if (navItem.linkType === "contact") {
      return (
        <li key={navItem._key} data-mobile-nav-item className="flex justify-center">
          <span onClick={closeMenu} className="inline-flex">
            <ContactFormTrigger
              className={cn(
                buttonVariants({ variant, size: "sm" }),
                hasBg ? bgItemClass : pillItemClass
              )}
            >
              {navItem.title}
            </ContactFormTrigger>
          </span>
        </li>
      );
    }

    if (navItem.linkType === "anchor-link") {
      const anchor = getAnchorData(navItem);
      const anchorId = anchor?.anchorId ?? null;

      // ✅ On home: button (no Next navigation)
      if (pathname === "/" && anchorId) {
        return (
          <li
            key={navItem._key}
            data-mobile-nav-item
            className={cn("flex justify-center", hasBg && "w-full")}
          >
            <button
              type="button"
              onClick={(e) => handleAnchorActivate(e, navItem)}
              className={cn(
                buttonVariants({ variant, size: "sm" }),
                hasBg ? bgItemClass : pillItemClass
              )}
            >
              {navItem.title}
            </button>
          </li>
        );
      }

      // ✅ Not home: navigate to "/#id"
      const rawHref = (navItem as any)?.href || (anchorId ? `#${anchorId}` : "");
      const href = normalizeAnchorHref(rawHref || (anchorId ? `/#${anchorId}` : "/"));

      return (
        <li
          key={navItem._key}
          data-mobile-nav-item
          className={cn("flex justify-center", hasBg && "w-full")}
        >
          <Link
            href={href}
            scroll={false}
            onClick={() => closeMenu()}
            className={cn(
              buttonVariants({ variant, size: "sm" }),
              hasBg ? bgItemClass : pillItemClass
            )}
          >
            {navItem.title}
          </Link>
        </li>
      );
    }

    return (
      <li
        key={navItem._key}
        data-mobile-nav-item
        className={cn("flex justify-center", hasBg && "w-full")}
      >
        <span onClick={closeMenu} className={cn("inline-flex", hasBg && "w-full")}>
          <Button
            link={navItem as any}
            variant={variant}
            size="sm"
            className={cn(hasBg ? bgItemClass : pillItemClass)}
          >
            {navItem.title}
          </Button>
        </span>
      </li>
    );
  };

  const hasBottom = showBottomLinks && defaultBottomLinks.length > 0;

  const overlay =
    mounted &&
    createPortal(
      <div
        ref={shellRef}
        className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4"
      >
        <div ref={bgRef} className="absolute inset-0 bg-white" onClick={closeMenu} />

        <div
          ref={panelRef}
          className="relative w-full max-w-md border bg-background/95 px-6 py-8"
          style={{ transform: "scaleY(0)", transformOrigin: "top center" }}
        >
          <div className="sr-only">
            <h2>Main Navigation</h2>
            <p>Navigate to the website pages</p>
          </div>

          <div className="pt-8 pb-4">
            <ul className="list-none text-center uppercase space-y-3">
              {topLinks.map(renderLinkItem)}
              {hasBottom && <>{defaultBottomLinks.map(renderLinkItem)}</>}
              <li data-mobile-nav-item className="pt-6">
                <div className="justify-center hidden">
                  <ModeToggle />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <Button
        aria-label={open ? "Close Menu" : "Open Menu"}
        variant="menu"
        onClick={toggleMenu}
        className={cn(
          "relative z-[70] h-10 w-10 rounded-none",
          "!p-0",
          "!inline-flex !items-center !justify-center",
          "!leading-none"
        )}
        style={{ lineHeight: 0 }}
      >
        <span
          ref={iconWrapRef}
          className={cn("h-full w-full", "inline-flex items-center justify-center", "leading-none")}
          style={{ lineHeight: 0 }}
        >
          {icon === "menu" ? (
            <Menu className="block h-4 w-4 scale-x-[0.6] dark:text-white" />
          ) : (
            <X className="block h-4 w-4 scale-x-[0.6] dark:text-white" />
          )}
        </span>
      </Button>

      {overlay}
    </>
  );
}
