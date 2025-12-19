"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";
import LogoAnimated from "@/components/logo-animated";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
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
  const isMemeBoothRoute = !!pathname?.startsWith("/meme-booth");

  const { overrides } = useHeaderNavOverrides();

  // Cache replacement links so we can animate them OUT after overrides reset to null
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

  const rightOpen =
    !isMemeBoothRoute ? true : (overrides?.showDesktopRightLinks ?? true);

  const readyToInitialize = !isMemeBoothRoute || overrides !== null;

  const handleSamePageAnchor = useCallback(
    (e: React.MouseEvent, navItem: NavLinkLite) => {
      const anchor = getAnchorData(navItem);
      if (!anchor?.anchorId) return;

      // This handler is ONLY for same-page anchors (home).
      e.preventDefault();
      e.stopPropagation();

      dispatchAnchorNavigate(anchor.anchorId, anchor.anchorOffsetPercent);
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
          const anchor = getAnchorData(navItem);
          const anchorId = anchor?.anchorId ?? null;

          // ✅ On home: do NOT use <Link href="#...">. Use a button.
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

          // ✅ Not on home: navigate to home anchor normally
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
          const anchor = getAnchorData(navItem);
          const anchorId = anchor?.anchorId ?? null;

          // ✅ On home: no <Link href="#...">. Use button.
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

          // ✅ Not on home: navigate to home anchor
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

    const seq = ++seqIdRef.current;
    const stillCurrent = () => seqIdRef.current === seq;

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

        if (!stillCurrent()) return;

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
