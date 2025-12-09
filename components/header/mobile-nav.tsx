// components/header/mobile-nav.tsx
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { Menu, X } from "lucide-react";
import {
  SETTINGS_QUERYResult,
  NAVIGATION_QUERYResult,
} from "@/sanity.types";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";
import ScrollSmoother from "gsap/ScrollSmoother";
import gsap from "gsap";
import { ModeToggle } from "@/components/menu-toggle";


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

export default function MobileNav({
  navigation,
  settings,
}: {
  navigation: NAVIGATION_QUERYResult;
  settings: SETTINGS_QUERYResult;
}) {
  const [open, setOpen] = useState(false);

  const navDoc: NavigationDoc | undefined = navigation[0];

  const leftLinks: SanityLink[] =
    (navDoc?.leftLinks as SanityLink[]) ?? [];
  const rightLinks: SanityLink[] =
    (navDoc?.rightLinks as SanityLink[]) ?? [];

  const links: SanityLink[] = [...leftLinks, ...rightLinks];

  const handleAnchorClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, navItem: SanityLink) => {
      const anchorData = getAnchorData(navItem);
      if (!anchorData || !anchorData.anchorId) return;

      e.preventDefault();
      setOpen(false);
      scrollToAnchor(anchorData.anchorId, anchorData.anchorOffsetPercent);
    },
    []
  );

  // GSAP refs
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  // Initial GSAP state
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const ctx = gsap.context(() => {
      gsap.set(panel, {
        transformOrigin: "top right",
        scaleX: 0.2,
        scaleY: 0,
        opacity: 0,
      });

      const items = itemsRef.current.filter(Boolean);
      if (items.length) {
        gsap.set(items, { opacity: 0, y: 10 });
      }
    }, panel);

    return () => ctx.revert();
  }, []);

  // Open / close animation
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const items = itemsRef.current.filter(Boolean);

    if (open) {
      const tl = gsap.timeline();

      // width (scaleX) first
      tl.to(panel, {
        duration: 0.25,
        scaleX: 1,
        opacity: 1,
        ease: "power2.out",
      })
        // then height (scaleY)
        .to(
          panel,
          {
            duration: 0.25,
            scaleY: 1,
            ease: "power2.out",
          },
          "-=0.05"
        )
        // then stagger in menu items
        .to(
          items,
          {
            duration: 0.2,
            opacity: 1,
            y: 0,
            stagger: 0.05,
            ease: "power2.out",
          },
          "-=0.1"
        );
    } else {
      // reset for next open
      gsap.set(panel, {
        scaleX: 0.2,
        scaleY: 0,
        opacity: 0,
      });
      if (items.length) {
        gsap.set(items, { opacity: 0, y: 10 });
      }
    }
  }, [open]);

  return (
    <>
      {/* Menu button in header – square box, bg/background, border, no radius */}
      <Button
        aria-label={open ? "Close Menu" : "Open Menu"}
        variant="menu"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative z-[70] flex h-10 w-10 items-center justify-center",
          " rounded-none p-0",
          "focus-visible:ring-1 focus-visible:ring-offset-1"
        )}
      >
        {open ? (
          <X className="h-4 w-4 scale-x-[0.6] dark:text-white" />
        ) : (
          <Menu className="h-4 w-4 scale-x-[0.6] dark:text-white" />
        )}
      </Button>

      {/* Custom overlay + panel */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex items-start justify-end pt-20 pr-4 transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Dimmed background, click to close */}
        <div
          className="absolute inset-0 bg-black/80"
          onClick={() => setOpen(false)}
        />

        {/* Inner animated panel, aligned to top-right */}
        <div
          ref={panelRef}
          className="relative w-full max-w-md border bg-background/95 px-6 py-8"
        >
          <div className="p-0 flex flex-col gap-1.5">

            <div className="sr-only">
              <h2>Main Navigation</h2>
              <p>Navigate to the website pages</p>
            </div>
          </div>

          <div className="pt-8 pb-4">
            <ul className="list-none text-center uppercase space-y-3">
              {links.map((navItem, index) => {
                const variant =
                  navItem.buttonVariant === "menu"
                    ? "link"
                    : ((navItem.buttonVariant as
                      | "link"
                      | "default"
                      | "destructive"
                      | "outline"
                      | "secondary"
                      | "underline"
                      | "menu"
                      | "icon"
                      | null
                      | undefined) ?? "default");

                const setItemRef = (el: HTMLLIElement | null) => {
                  itemsRef.current[index] = el;
                };

                if (navItem.linkType === "contact") {
                  return (
                    <li key={navItem._key} ref={setItemRef}>
                      <ContactFormTrigger
                        className={cn(
                          buttonVariants({
                            variant,
                          }),
                          navItem.buttonVariant === "menu" &&
                          "hover:text-decoration-none hover:opacity-50 text-lg p-0 h-auto hover:bg-transparent"
                        )}
                      >
                        {navItem.title}
                      </ContactFormTrigger>
                    </li>
                  );
                }

                if (navItem.linkType === "anchor-link") {
                  const anchorData = getAnchorData(navItem);
                  const href =
                    anchorData?.anchorId ? `#${anchorData.anchorId}` : "#";

                  return (
                    <li key={navItem._key} ref={setItemRef}>
                      <Link
                        href={href}
                        onClick={(e) => handleAnchorClick(e, navItem)}
                        className={cn(
                          buttonVariants({
                            variant,
                          }),
                          navItem.buttonVariant === "menu" &&
                          "hover:text-decoration-none hover:opacity-50 text-lg p-0 h-auto hover:bg-transparent"
                        )}
                      >
                        {navItem.title}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={navItem._key} ref={setItemRef}>
                    <Link
                      onClick={() => setOpen(false)}
                      href={navItem.href || "#"}
                      target={navItem.target ? "_blank" : undefined}
                      rel={
                        navItem.target ? "noopener noreferrer" : undefined
                      }
                      className={cn(
                        buttonVariants({
                          variant,
                        }),
                        navItem.buttonVariant === "menu" &&
                        "hover:text-decoration-none hover:opacity-50 text-lg p-0 h-auto hover:bg-transparent"
                      )}
                    >
                      {navItem.title}
                    </Link>
                  </li>
                );
              })}

              {/* Mode toggle inside the menu (last item) */}
              <li
                ref={(el) => {
                  itemsRef.current[links.length] = el;
                }}
                className="pt-6"
              >
                <div className="flex justify-center">
                  <ModeToggle />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
