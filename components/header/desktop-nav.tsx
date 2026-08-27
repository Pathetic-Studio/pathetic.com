//components/header/desktop-nav.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";
import LogoAnimated from "@/components/logo-animated";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import { InstagramIcon } from "../ui/instagram-icon";
import DesktopNavRightAnim, { DesktopNavRightAnimHandle } from "./desktop-nav-right-anim";
import DesktopNavLeftAnim, { DesktopNavLeftAnimHandle } from "./desktop-nav-left-anim";
import DesktopNavSocialAnim, { DesktopNavSocialAnimHandle } from "./desktop-nav-social-anim";
import { useHeaderNavOverrides, type NavLinkLite } from "./nav-overrides";
import { useIntroHandoffPending } from "./intro-handoff";
import { useInitialHashEntryPending } from "./initial-hash-entry";
import {
  HeaderFeatureVisualEffects,
  HeaderLogoVisualEffects,
} from "./visual-effects";
import { stegaClean } from "next-sanity";
import {
  registerLeftNavController,
  registerRightNavController,
  registerSocialNavController,
} from "./nav-anim-registry";

type NavigationDoc = NAVIGATION_QUERYResult[0];
type NavLink = NonNullable<NonNullable<NavigationDoc["leftLinks"]>[number]>;

type AnchorLinkExtra = {
  linkType: "anchor-link";
  anchorId?: string | null;
  anchorOffsetPercent?: number | null;
};

function getAnchorData(navItem: NavLinkLite): AnchorLinkExtra | null {
  if (navItem.linkType !== "anchor-link") return null;
  return {
    linkType: "anchor-link",
    anchorId: navItem.anchorId ?? null,
    anchorOffsetPercent: navItem.anchorOffsetPercent ?? null,
  };
}

/** Persist last visible left slot across remounts */
let LAST_LEFT_SLOT: "default" | "replace" | null = null;

function dispatchAnchorNavigate(anchorId: string, offsetPercent?: number | null) {
  try {
    window.dispatchEvent(
      new CustomEvent("app:anchor-navigate", {
        detail: { anchorId, offsetPercent, href: `/#${anchorId}` },
      })
    );
  } catch { }
}

export default function DesktopNav({
  navigation,
  settings,
}: {
  navigation: NAVIGATION_QUERYResult;
  settings: any;
}) {
  const nav = navigation[0];
  const instagramUrl = nav.instagram;

  const defaultLeftLinks: NavLink[] = (nav?.leftLinks as NavLink[]) ?? [];
  const rightLinks: NavLink[] = (nav?.rightLinks as NavLink[]) ?? [];

  const pathname = usePathname();
  const isMemeBoothRoute = !!pathname?.startsWith("/booth");

  const { overrides } = useHeaderNavOverrides();
  const introHandoffPending = useIntroHandoffPending();
  const initialHashEntryPending = useInitialHashEntryPending();
  const headerEntryPending = introHandoffPending || initialHashEntryPending;

  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);

  const logoLinkRef = useRef<HTMLAnchorElement | null>(null);
  const shouldAnimateInitialHashLogoRef = useRef(initialHashEntryPending);

  const [cachedReplaceLinks, setCachedReplaceLinks] = useState<NavLinkLite[]>([]);
  useEffect(() => {
    const incoming = overrides?.leftNavReplace ?? null;
    if (incoming && incoming.length) setCachedReplaceLinks(incoming);
  }, [overrides?.leftNavReplace]);

  const replaceLinks: NavLinkLite[] = useMemo(() => {
    const live = overrides?.leftNavReplace ?? null;
    if (live && live.length) return live;
    return cachedReplaceLinks;
  }, [overrides?.leftNavReplace, cachedReplaceLinks]);

  const needsLeftReplace = useMemo(() => {
    return isMemeBoothRoute && (overrides?.leftNavReplace?.length ?? 0) > 0;
  }, [isMemeBoothRoute, overrides?.leftNavReplace]);

  const targetLeftSlot: "default" | "replace" = needsLeftReplace ? "replace" : "default";

  // -----------------------------
  // RIGHT SLOT: LATCHED OPEN STATE
  // -----------------------------
  const desiredRightOpen = useMemo(() => {
    if (!isMemeBoothRoute) return true;
    // when overrides are present, use them
    return overrides?.showDesktopRightLinks ?? true;
  }, [isMemeBoothRoute, overrides?.showDesktopRightLinks]);

  // latch across the overrides-not-ready window (Home -> Meme)
  const [latchedRightOpen, setLatchedRightOpen] = useState<boolean>(true);

  useEffect(() => {
    // Loader always forces closed
    if (!hydrated || headerEntryPending) return;

    // Home: always open
    if (!isMemeBoothRoute) {
      setLatchedRightOpen(true);
      return;
    }

    // Meme: wait until overrides exist before changing latch
    if (overrides === null) return;

    setLatchedRightOpen(desiredRightOpen);
  }, [hydrated, headerEntryPending, isMemeBoothRoute, overrides, desiredRightOpen]);

  const rightOpenEffective = hydrated && !headerEntryPending ? latchedRightOpen : false;

  // "ready" is purely for left slot swapping now.
  const readyToInitialize = !isMemeBoothRoute || overrides !== null;

  const handleSamePageAnchor = useCallback((e: React.MouseEvent, navItem: NavLinkLite) => {
    const anchor = getAnchorData(navItem);
    if (!anchor?.anchorId) return;

    e.preventDefault();
    e.stopPropagation();
    dispatchAnchorNavigate(anchor.anchorId, anchor.anchorOffsetPercent);
  }, []);

  const leftDefaultRef = useRef<DesktopNavLeftAnimHandle | null>(null);
  const leftReplaceRef = useRef<DesktopNavLeftAnimHandle | null>(null);

  const rightRef = useRef<DesktopNavRightAnimHandle | null>(null);
  const socialRef = useRef<DesktopNavSocialAnimHandle | null>(null);

  useEffect(() => {
    const proxy = {
      open: async () => {
        const active = targetLeftSlot === "replace" ? leftReplaceRef.current : leftDefaultRef.current;
        await active?.open();
      },
      close: async () => {
        const active = targetLeftSlot === "replace" ? leftReplaceRef.current : leftDefaultRef.current;
        await active?.close();
      },
      setOpenImmediate: (open: boolean) => {
        const active = targetLeftSlot === "replace" ? leftReplaceRef.current : leftDefaultRef.current;
        active?.setOpenImmediate(open);
      },
    };

    registerLeftNavController(proxy);
    return () => registerLeftNavController(null);
  }, [targetLeftSlot]);

  useEffect(() => {
    if (!rightRef.current) return;
    registerRightNavController(rightRef.current);
    return () => registerRightNavController(null);
  }, []);

  useEffect(() => {
    if (!socialRef.current) return;

    registerSocialNavController(socialRef.current);
    return () => registerSocialNavController(null);
  }, []);

  useEffect(() => {
    if (!socialRef.current) return;

    if (!hydrated || headerEntryPending) {
      socialRef.current.setOpenImmediate(false);
      return;
    }

    void socialRef.current.open();
  }, [hydrated, headerEntryPending]);

  useEffect(() => {
    if (!rightRef.current) return;

    if (!hydrated || headerEntryPending) {
      rightRef.current.setOpenImmediate(false);
      return;
    }

    if (rightOpenEffective) {
      void rightRef.current.open();
      return;
    }

    void rightRef.current.close();
  }, [hydrated, headerEntryPending, rightOpenEffective]);

  useLayoutEffect(() => {
    const el = logoLinkRef.current;
    if (!el) return;

    gsap.killTweensOf(el);

    if (!hydrated || introHandoffPending) {
      gsap.set(el, {
        autoAlpha: 0,
        scale: 1,
        transformOrigin: "50% 50%",
      });
      return;
    }

    if (initialHashEntryPending) {
      gsap.set(el, {
        autoAlpha: 0,
        scale: 0.42,
        transformOrigin: "50% 50%",
      });
      return;
    }

    if (shouldAnimateInitialHashLogoRef.current) {
      shouldAnimateInitialHashLogoRef.current = false;

      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 0.42, transformOrigin: "50% 50%" },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.68,
          ease: "elastic.out(1, 1)",
          overwrite: "auto",
        }
      );
      return;
    }

    gsap.set(el, { autoAlpha: 1, scale: 1, transformOrigin: "50% 50%" });
  }, [hydrated, introHandoffPending, initialHashEntryPending]);

  const renderLeftLinks = (links: NavLinkLite[]) => (
    <>
      {links.map((navItem, index) => {
        const key = navItem._key;
        const explicitPreset = stegaClean(
          (navItem as NavLinkLite & { headerVisualPreset?: string | null })
            .headerVisualPreset,
        );
        const isLegacyFeatureStar =
          explicitPreset == null &&
          index === 0 &&
          !!(navItem as any).backgroundImageEnabled &&
          ((navItem as any).backgroundImages?.length ?? 0) > 0;
        const isFeatureStar =
          explicitPreset === "feature-star" || isLegacyFeatureStar;
        const resolvedNavItem = isFeatureStar
          ? ({ ...navItem, headerVisualPreset: "feature-star" } as NavLinkLite)
          : navItem;

        const wrapLeftItem = (child: React.ReactNode) => (
          <span
            key={key}
            data-left-nav-item
            data-header-feature-root={isFeatureStar ? "true" : undefined}
            className="relative inline-flex [perspective:700px]"
          >
            {isFeatureStar && <HeaderFeatureVisualEffects />}
            <span className="relative z-10 inline-flex">{child}</span>
          </span>
        );

        if (navItem.linkType === "contact") {
          return wrapLeftItem(
              <ContactFormTrigger className={cn(buttonVariants({ variant: "menu", size: "sm" }))}>
                {navItem.title}
              </ContactFormTrigger>
          );
        }

        if (navItem.linkType === "anchor-link") {
          const anchor = getAnchorData(navItem);
          const anchorId = anchor?.anchorId ?? null;

          if (pathname === "/" && anchorId) {
            return wrapLeftItem(
                <button
                  type="button"
                  onClick={(e) => handleSamePageAnchor(e, navItem)}
                  className={cn(
                    buttonVariants({ variant: "menu", size: "sm" }),
                    "transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0"
                  )}
                >
                  {navItem.title}
                </button>
            );
          }

          const href = anchorId ? `/#${anchorId}` : "/";

          return wrapLeftItem(
              <Link
                href={href}
                scroll={false}
                className={cn(
                  buttonVariants({ variant: "menu", size: "sm" }),
                  "transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0"
                )}
              >
                {navItem.title}
              </Link>
          );
        }

        return wrapLeftItem(
            <Button
              link={resolvedNavItem as any}
              variant="menu"
              size="sm"
              className={cn("transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0")}
            >
              {navItem.title}
            </Button>
        );
      })}
    </>
  );

  const renderRightLinks = (links: NavLinkLite[]) => (
    <>
      {links.map((navItem) => {
        const variant =
          (navItem.buttonVariant as
            | "link"
            | "default"
            | "destructive"
            | "outline"
            | "secondary"
            | "underline"
            | "menu"
            | "icon"
            | null
            | undefined) ?? "underline";

        if (navItem.linkType === "contact") {
          return (
            <ContactFormTrigger
              key={navItem._key}
              data-right-nav-item
              className={cn(
                buttonVariants({ variant, size: "sm" }),
                "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
              )}
            >
              {navItem.title}
            </ContactFormTrigger>
          );
        }

        if (navItem.linkType === "anchor-link") {
          const anchor = getAnchorData(navItem);
          const anchorId = anchor?.anchorId ?? null;

          if (pathname === "/" && anchorId) {
            return (
              <button
                key={navItem._key}
                type="button"
                onClick={(e) => handleSamePageAnchor(e, navItem)}
                data-right-nav-item
                className={cn(
                  buttonVariants({ variant, size: "sm" }),
                  "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
                )}
              >
                {navItem.title}
              </button>
            );
          }

          const href = anchorId ? `/#${anchorId}` : "/";

          return (
            <Link
              key={navItem._key}
              href={href}
              scroll={false}
              data-right-nav-item
              className={cn(
                buttonVariants({ variant, size: "sm" }),
                "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
              )}
            >
              {navItem.title}
            </Link>
          );
        }

        return (
          <Button
            key={navItem._key}
            link={navItem as any}
            variant={variant}
            size="sm"
            data-right-nav-item
            className={cn("transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full")}
          >
            {navItem.title}
          </Button>
        );
      })}
    </>
  );

  useEffect(() => {
    if (!leftDefaultRef.current || !leftReplaceRef.current) return;

    if (headerEntryPending || !hydrated) {
      leftDefaultRef.current.setOpenImmediate(false);
      leftReplaceRef.current.setOpenImmediate(false);
      return;
    }

    if (!readyToInitialize) {
      leftDefaultRef.current.setOpenImmediate(false);
      leftReplaceRef.current.setOpenImmediate(false);
      return;
    }

    if (targetLeftSlot === "replace" && replaceLinks.length === 0) {
      leftDefaultRef.current.setOpenImmediate(false);
      leftReplaceRef.current.setOpenImmediate(false);
      return;
    }

    const run = async () => {
      leftDefaultRef.current!.setOpenImmediate(false);
      leftReplaceRef.current!.setOpenImmediate(false);

      const prev = LAST_LEFT_SLOT;
      const next = targetLeftSlot;

      if (prev === null) {
        if (next === "replace") await leftReplaceRef.current!.open();
        else await leftDefaultRef.current!.open();
        LAST_LEFT_SLOT = next;
        return;
      }

      if (prev !== next) {
        if (prev === "replace") leftReplaceRef.current!.setOpenImmediate(true);
        else leftDefaultRef.current!.setOpenImmediate(true);

        if (prev === "replace") await leftReplaceRef.current!.close();
        else await leftDefaultRef.current!.close();

        if (prev === "replace") setCachedReplaceLinks([]);

        if (next === "replace") await leftReplaceRef.current!.open();
        else await leftDefaultRef.current!.open();

        LAST_LEFT_SLOT = next;
        return;
      }

      if (next === "replace") await leftReplaceRef.current!.open();
      else await leftDefaultRef.current!.open();

      LAST_LEFT_SLOT = next;
    };

    void run();
  }, [headerEntryPending, hydrated, readyToInitialize, targetLeftSlot, replaceLinks.length]);

  const headerLogoStyle =
    !hydrated || introHandoffPending
      ? { opacity: 0, visibility: "hidden" as const }
      : undefined;

  return (
    <div data-header-desktop-nav className="hidden xl:flex w-full h-16 items-center justify-between text-primary">
      <div className="flex flex-1 h-16 items-center justify-start">
        <div className="grid h-8 items-center">
          <DesktopNavLeftAnim
            ref={leftDefaultRef}
            className="flex h-8 items-center gap-4 [grid-area:1/1]"
          >
            {renderLeftLinks(defaultLeftLinks as unknown as NavLinkLite[])}
          </DesktopNavLeftAnim>

          <DesktopNavLeftAnim
            ref={leftReplaceRef}
            className="flex h-8 items-center gap-4 [grid-area:1/1]"
          >
            {renderLeftLinks(replaceLinks)}
          </DesktopNavLeftAnim>
        </div>
      </div>

      <div className="flex h-16 items-center justify-center">
        <Link
          ref={logoLinkRef}
          href="/"
          aria-label="Home page"
          id="header-logo-main-desktop"
          data-header-logo-main="true"
          className="relative flex h-8 items-center justify-center will-change-transform"
          style={headerLogoStyle}
        >
          <span
            data-header-logo-native="true"
            className="relative z-10 flex h-8 items-center justify-center"
          >
            <LogoAnimated className="h-8 w-auto" />
          </span>
          <HeaderLogoVisualEffects />
        </Link>
      </div>

      <div className="flex flex-1 h-16 justify-end gap-2 items-center">
        <DesktopNavRightAnim
          ref={rightRef}
          isOpen={false}
        >
          {renderRightLinks(rightLinks as unknown as NavLinkLite[])}
        </DesktopNavRightAnim>

        <DesktopNavSocialAnim ref={socialRef} className="h-8">
          <span
            data-social-nav-item
            className={cn(
              "inline-flex items-center h-8",
              "border-0 outline-none ring-0 shadow-none",
              "[&_*]:border-0 [&_*]:outline-none [&_*]:ring-0 [&_*]:shadow-none"
            )}
          >
            <InstagramIcon instagramUrl={instagramUrl} />
          </span>
        </DesktopNavSocialAnim>
      </div>
    </div>
  );
}
