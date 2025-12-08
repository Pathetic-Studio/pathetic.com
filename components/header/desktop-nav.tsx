// components/header/desktop-nav.tsx
"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";
import LogoAnimated from "@/components/logo-animated";
import { ModeToggle } from "@/components/menu-toggle";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import ScrollSmoother from "gsap/ScrollSmoother";

type NavigationDoc = NAVIGATION_QUERYResult[0];

type SanityLink = NonNullable<
  NonNullable<NavigationDoc["leftLinks"]>[number]
>;

type AnchorLinkExtra = {
  linkType: "anchor-link";
  anchorId?: string | null;
  anchorOffsetPercent?: number | null;
};

function getAnchorData(navItem: SanityLink): AnchorLinkExtra | null {
  if (navItem.linkType !== "anchor-link") return null;

  // Cast to grab the extra fields coming from Sanity
  const itemWithAnchor = navItem as SanityLink & AnchorLinkExtra;
  return {
    linkType: "anchor-link",
    anchorId: itemWithAnchor.anchorId,
    anchorOffsetPercent: itemWithAnchor.anchorOffsetPercent,
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

export default function DesktopNav({
  navigation,
  settings,
}: {
  navigation: NAVIGATION_QUERYResult;
  settings: any;
}) {
  const nav = navigation[0];

  const leftLinks: SanityLink[] = (nav?.leftLinks as SanityLink[]) ?? [];
  const rightLinks: SanityLink[] = (nav?.rightLinks as SanityLink[]) ?? [];

  const handleAnchorClick = useCallback(
    (
      e: React.MouseEvent<HTMLAnchorElement>,
      navItem: SanityLink
    ) => {
      const anchorData = getAnchorData(navItem);
      if (!anchorData || !anchorData.anchorId) return;

      e.preventDefault();

      // scroll via ScrollSmoother / fallback
      scrollToAnchor(anchorData.anchorId, anchorData.anchorOffsetPercent);

      // manually update hash in URL
      const hash = `#${anchorData.anchorId}`;
      if (typeof window !== "undefined" && window.location.hash !== hash) {
        window.history.pushState(null, "", hash);
      }
    },
    []
  );


  return (
    <div className="hidden xl:flex w-full items-center justify-between text-primary">
      {/* Left links */}
      <div className="flex flex-1 items-center justify-start gap-4">
        {leftLinks.map((navItem) => {
          if (navItem.linkType === "contact") {
            return (
              <ContactFormTrigger
                key={navItem._key}
                className={cn(
                  buttonVariants({
                    variant: "menu",
                    size: "sm",
                  }),

                )}
              >
                {navItem.title}
              </ContactFormTrigger>
            );
          }

          if (navItem.linkType === "anchor-link") {
            const anchorData = getAnchorData(navItem);
            const href =
              anchorData?.anchorId ? `#${anchorData.anchorId}` : "#";

            return (
              <Link
                key={navItem._key}
                href={href}
                onClick={(e) => handleAnchorClick(e, navItem)}
                className={cn(
                  buttonVariants({
                    variant: "menu",
                    size: "sm",
                  }),
                  "transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0"
                )}
              >
                {navItem.title}
              </Link>
            );
          }

          return (
            <Link
              key={navItem._key}
              href={navItem.href || "#"}
              target={navItem.target ? "_blank" : undefined}
              rel={
                navItem.target
                  ? "noopener noreferrer"
                  : undefined
              }
              className={cn(
                buttonVariants({
                  variant: "menu",
                  size: "sm",
                }),
                "transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0"
              )}
            >
              {navItem.title}
            </Link>
          );
        })}
      </div>

      {/* Center logo */}
      <div className="flex justify-center">
        <Link
          href="/"
          aria-label="Home page"
          id="header-logo-main"
          className="flex items-center justify-center"
        >
          <LogoAnimated className="h-8 w-auto" />
        </Link>
      </div>

      {/* Right links + mode toggle */}
      <div className="flex flex-1 justify-end gap-2 items-stretch">
        <div className="flex items-center gap-2 border border-border bg-background/100 px-3 py-0">
          {rightLinks.map((navItem) => {
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
                  className={cn(
                    buttonVariants({
                      variant,
                      size: "sm",
                    }),
                    "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
                  )}
                >
                  {navItem.title}
                </ContactFormTrigger>
              );
            }

            if (navItem.linkType === "anchor-link") {
              const anchorData = getAnchorData(navItem);
              const href =
                anchorData?.anchorId ? `#${anchorData.anchorId}` : "#";

              return (
                <Link
                  key={navItem._key}
                  href={href}
                  onClick={(e) => handleAnchorClick(e, navItem)}
                  className={cn(
                    buttonVariants({
                      variant,
                      size: "sm",
                    }),
                    "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
                  )}
                >
                  {navItem.title}
                </Link>
              );
            }

            return (
              <Link
                key={navItem._key}
                href={navItem.href || "#"}
                target={navItem.target ? "_blank" : undefined}
                rel={
                  navItem.target
                    ? "noopener noreferrer"
                    : undefined
                }
                className={cn(
                  buttonVariants({
                    variant,
                    size: "sm",
                  }),
                  "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
                )}
              >
                {navItem.title}
              </Link>
            );
          })}
        </div>

        <div className="h-full flex items-center border border-border">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
