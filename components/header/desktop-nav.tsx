// components/header/desktop-nav.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";
import LogoAnimated from "@/components/logo-animated";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import ScrollSmoother from "gsap/ScrollSmoother";
import { InstagramIcon } from "../ui/instagram-icon";
import DesktopNavRightAnim from "./desktop-nav-right-anim";
import DesktopNavLeftAnim, { DesktopNavLeftAnimHandle } from "./desktop-nav-left-anim";
import { useHeaderNavOverrides, type NavLinkLite } from "./nav-overrides";

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

function scrollToAnchor(anchorId: string, offsetPercent?: number | null) {
  const target = document.getElementById(anchorId);
  if (!target) return;

  const smoother = ScrollSmoother.get();
  const offsetPct = typeof offsetPercent === "number" ? offsetPercent : 0;
  const offsetPx = (offsetPct / 100) * window.innerHeight;

  if (smoother) {
    const contentY = smoother.offset(target, "top");
    const finalY = contentY - offsetPx;
    smoother.scrollTo(finalY, true);
  } else {
    const rect = target.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const finalY = rect.top + scrollY - offsetPx;
    window.scrollTo({ top: finalY, behavior: "smooth" });
  }
}

/** Persist last visible left slot across remounts */
let LAST_LEFT_SLOT: "default" | "replace" | null = null;

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
  const isMemeBoothRoute = !!pathname?.startsWith("/meme-booth");

  const { overrides } = useHeaderNavOverrides();

  // Cache replacement links so we can animate them OUT after overrides reset to null
  const [cachedReplaceLinks, setCachedReplaceLinks] = useState<NavLinkLite[]>([]);

  useEffect(() => {
    const incoming = overrides?.leftNavReplace ?? null;
    if (incoming && incoming.length) {
      setCachedReplaceLinks(incoming);
    }
  }, [overrides?.leftNavReplace]);

  // Use overrides when present; fall back to cache for "animate out after leaving"
  const replaceLinks: NavLinkLite[] = useMemo(() => {
    const live = overrides?.leftNavReplace ?? null;
    if (live && live.length) return live;
    return cachedReplaceLinks;
  }, [overrides?.leftNavReplace, cachedReplaceLinks]);

  const needsLeftReplace = useMemo(() => {
    return isMemeBoothRoute && (overrides?.leftNavReplace?.length ?? 0) > 0;
  }, [isMemeBoothRoute, overrides?.leftNavReplace]);

  const targetLeftSlot: "default" | "replace" = needsLeftReplace ? "replace" : "default";

  // Right intended state
  const rightOpen =
    !isMemeBoothRoute ? true : (overrides?.showDesktopRightLinks ?? true);

  // Gate initialization on meme-booth until overrides arrive (prevents wrong-state flash)
  const readyToInitialize = !isMemeBoothRoute || overrides !== null;

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, navItem: NavLinkLite) => {
      const anchorData = getAnchorData(navItem);
      if (!anchorData?.anchorId) return;

      e.preventDefault();
      scrollToAnchor(anchorData.anchorId, anchorData.anchorOffsetPercent);

      const hash = `#${anchorData.anchorId}`;
      if (typeof window !== "undefined" && window.location.hash !== hash) {
        window.history.pushState(null, "", hash);
      }
    },
    []
  );

  const leftDefaultRef = useRef<DesktopNavLeftAnimHandle | null>(null);
  const leftReplaceRef = useRef<DesktopNavLeftAnimHandle | null>(null);
  const seqIdRef = useRef(0);

  const renderLeftLinks = (links: NavLinkLite[]) => (
    <>
      {links.map((navItem) => {
        const key = navItem._key;

        if (navItem.linkType === "contact") {
          return (
            <span key={key} data-left-nav-item className="inline-flex">
              <ContactFormTrigger
                className={cn(buttonVariants({ variant: "menu", size: "sm" }))}
              >
                {navItem.title}
              </ContactFormTrigger>
            </span>
          );
        }

        if (navItem.linkType === "anchor-link") {
          const anchorData = getAnchorData(navItem);
          const href = anchorData?.anchorId ? `#${anchorData.anchorId}` : "#";

          return (
            <span key={key} data-left-nav-item className="inline-flex">
              <Link
                href={href}
                onClick={(e) => handleAnchorClick(e, navItem)}
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
              className={cn(
                "transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0"
              )}
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
          const anchorData = getAnchorData(navItem);
          const href = anchorData?.anchorId ? `#${anchorData.anchorId}` : "#";

          return (
            <Link
              key={navItem._key}
              href={href}
              onClick={(e) => handleAnchorClick(e, navItem)}
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
            className={cn(
              "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
            )}
          >
            {navItem.title}
          </Button>
        );
      })}
    </>
  );

  useEffect(() => {
    if (!leftDefaultRef.current || !leftReplaceRef.current) return;

    // Not ready (cold meme-booth before overrides): keep both hidden
    if (!readyToInitialize) {
      leftDefaultRef.current.setOpenImmediate(false);
      leftReplaceRef.current.setOpenImmediate(false);
      return;
    }

    // If we need replacement but links haven't arrived yet, wait.
    if (targetLeftSlot === "replace" && replaceLinks.length === 0) {
      leftDefaultRef.current.setOpenImmediate(false);
      leftReplaceRef.current.setOpenImmediate(false);
      return;
    }

    const seq = ++seqIdRef.current;
    const stillCurrent = () => seqIdRef.current === seq;

    const run = async () => {
      leftDefaultRef.current!.setOpenImmediate(false);
      leftReplaceRef.current!.setOpenImmediate(false);

      const prev = LAST_LEFT_SLOT;
      const next = targetLeftSlot;

      // Cold load: open correct slot only (no swap)
      if (prev === null) {
        if (next === "replace") await leftReplaceRef.current!.open();
        else await leftDefaultRef.current!.open();
        LAST_LEFT_SLOT = next;
        return;
      }

      // Swap: animate prev out then next in
      if (prev !== next) {
        if (prev === "replace") leftReplaceRef.current!.setOpenImmediate(true);
        else leftDefaultRef.current!.setOpenImmediate(true);

        if (prev === "replace") await leftReplaceRef.current!.close();
        else await leftDefaultRef.current!.close();

        // After replace closes, clear cache so it doesn't linger
        if (prev === "replace") setCachedReplaceLinks([]);

        if (!stillCurrent()) return;

        if (next === "replace") await leftReplaceRef.current!.open();
        else await leftDefaultRef.current!.open();

        LAST_LEFT_SLOT = next;
        return;
      }

      // Same slot: ensure open
      if (next === "replace") await leftReplaceRef.current!.open();
      else await leftDefaultRef.current!.open();

      LAST_LEFT_SLOT = next;
    };

    void run();
  }, [readyToInitialize, targetLeftSlot, replaceLinks.length]);

  return (
    <div className="hidden xl:flex w-full items-center justify-between text-primary">
      {/* Left links */}
      <div className="flex flex-1 items-center justify-start">
        <div className="grid">
          <DesktopNavLeftAnim
            ref={leftDefaultRef}
            className="flex items-center gap-4 [grid-area:1/1]"
          >
            {renderLeftLinks(defaultLeftLinks as unknown as NavLinkLite[])}
          </DesktopNavLeftAnim>

          <DesktopNavLeftAnim
            ref={leftReplaceRef}
            className="flex items-center gap-4 [grid-area:1/1]"
          >
            {renderLeftLinks(replaceLinks)}
          </DesktopNavLeftAnim>
        </div>
      </div>

      {/* Center logo */}
      <div className="flex justify-center">
        <Link
          href="/"
          aria-label="Home page"
          id="header-logo-main-desktop"
          data-header-logo-main="true"
          className="flex items-center justify-center"
        >
          <LogoAnimated className="h-8 w-auto" />
        </Link>
      </div>

      {/* Right links + instagram */}
      <div className="flex flex-1 justify-end gap-2 items-stretch">
        <DesktopNavRightAnim ready={readyToInitialize} isOpen={rightOpen}>
          {renderRightLinks(rightLinks as unknown as NavLinkLite[])}
        </DesktopNavRightAnim>

        <div className="h-full flex items-center">
          <InstagramIcon instagramUrl={instagramUrl} />
        </div>
      </div>
    </div>
  );
}
