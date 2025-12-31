"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

function useLoaderPlaying(): boolean {
  const getSnapshot = () =>
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-loader-playing");

  const subscribe = (onStoreChange: () => void) => {
    const handler = () => onStoreChange();
    window.addEventListener("loader-playing-change", handler as any);
    return () => window.removeEventListener("loader-playing-change", handler as any);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
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
  const loaderPlaying = useLoaderPlaying();

  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);

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
    if (!hydrated || loaderPlaying) return;

    // Home: always open
    if (!isMemeBoothRoute) {
      setLatchedRightOpen(true);
      return;
    }

    // Meme: wait until overrides exist before changing latch
    if (overrides === null) return;

    setLatchedRightOpen(desiredRightOpen);
  }, [hydrated, loaderPlaying, isMemeBoothRoute, overrides, desiredRightOpen]);

  const rightOpenEffective = hydrated && !loaderPlaying ? latchedRightOpen : false;

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

    // keep existing behavior
    socialRef.current.setOpenImmediate(hydrated && !loaderPlaying);

    registerSocialNavController(socialRef.current);
    return () => registerSocialNavController(null);
  }, [loaderPlaying, hydrated]);

  const renderLeftLinks = (links: NavLinkLite[]) => (
    <>
      {links.map((navItem) => {
        const key = navItem._key;

        if (navItem.linkType === "contact") {
          return (
            <span key={key} data-left-nav-item className="inline-flex">
              <ContactFormTrigger className={cn(buttonVariants({ variant: "menu", size: "sm" }))}>
                {navItem.title}
              </ContactFormTrigger>
            </span>
          );
        }

        if (navItem.linkType === "anchor-link") {
          const anchor = getAnchorData(navItem);
          const anchorId = anchor?.anchorId ?? null;

          if (pathname === "/" && anchorId) {
            return (
              <span key={key} data-left-nav-item className="inline-flex">
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
              </span>
            );
          }

          const href = anchorId ? `/#${anchorId}` : "/";

          return (
            <span key={key} data-left-nav-item className="inline-flex">
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
            </span>
          );
        }

        return (
          <span key={key} data-left-nav-item className="inline-flex">
            <Button
              link={navItem as any}
              variant="menu"
              size="sm"
              className={cn("transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0")}
            >
              {navItem.title}
            </Button>
          </span>
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

    if (loaderPlaying || !hydrated) {
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
  }, [loaderPlaying, hydrated, readyToInitialize, targetLeftSlot, replaceLinks.length]);

  const headerLogoStyle = !hydrated ? { opacity: 0, visibility: "hidden" as const } : undefined;

  return (
    <div className="hidden xl:flex w-full h-16 items-center justify-between text-primary">
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
          href="/"
          aria-label="Home page"
          id="header-logo-main-desktop"
          data-header-logo-main="true"
          className="relative flex h-8 items-center justify-center"
          style={headerLogoStyle}
        >
          <span data-header-logo-native="true" className="flex h-8 items-center justify-center">
            <LogoAnimated className="h-8 w-auto" />
          </span>
        </Link>
      </div>

      <div className="flex flex-1 h-16 justify-end gap-2 items-center">
        <DesktopNavRightAnim
          ref={rightRef}
          isOpen={rightOpenEffective}
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
