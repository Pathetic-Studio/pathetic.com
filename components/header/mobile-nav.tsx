// components/header/mobile-nav.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { useCallback, useState } from "react";
import { AlignRight } from "lucide-react";
import {
  SETTINGS_QUERYResult,
  NAVIGATION_QUERYResult,
} from "@/sanity.types";
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

  // For mobile, just show all links in one column
  const links: SanityLink[] = [...leftLinks, ...rightLinks];

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, navItem: SanityLink) => {
      const anchorData = getAnchorData(navItem);
      if (!anchorData || !anchorData.anchorId) return;

      e.preventDefault();
      setOpen(false);
      scrollToAnchor(anchorData.anchorId, anchorData.anchorOffsetPercent);
    },
    []
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          aria-label="Open Menu"
          variant="menu"
          className="w-10 p-5 focus-visible:ring-1 focus-visible:ring-offset-1"
        >
          <AlignRight className="dark:text-white" />
        </Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <div className="mx-auto">
            <Logo settings={settings} />
          </div>
          <div className="sr-only">
            <SheetTitle>Main Navigation</SheetTitle>
            <SheetDescription>
              Navigate to the website pages
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="pt-10 pb-20">
          <div className="container">
            <ul className="list-none text-center space-y-3">
              {links.map((navItem) => {
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

                if (navItem.linkType === "contact") {
                  return (
                    <li key={navItem._key}>
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
                    <li key={navItem._key}>
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
                  <li key={navItem._key}>
                    <Link
                      onClick={() => setOpen(false)}
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
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
