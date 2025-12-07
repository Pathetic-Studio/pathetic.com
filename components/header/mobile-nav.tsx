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
import { useState } from "react";
import { AlignRight } from "lucide-react";
import {
  SETTINGS_QUERYResult,
  NAVIGATION_QUERYResult,
} from "@/sanity.types";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";

type NavigationDoc = NAVIGATION_QUERYResult[0];

// leftLinks/rightLinks have the same shape, so use one side as the base
type SanityLink = NonNullable<
  NonNullable<NavigationDoc["leftLinks"]>[number]
>;

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
                // Map Sanity buttonVariant to valid buttonVariants variant
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

                // Contact modal link
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

                // Regular link (internal/external resolved to href)
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
