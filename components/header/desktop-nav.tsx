// components/header/desktop-nav.tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NAVIGATION_QUERYResult } from "@/sanity.types";
import LogoAnimated from "@/components/logo-animated";
import { ModeToggle } from "@/components/menu-toggle";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";

type NavigationDoc = NAVIGATION_QUERYResult[0];

type SanityLink = NonNullable<
  NonNullable<NavigationDoc["leftLinks"]>[number]
>;

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

  return (
    <div className="hidden xl:flex w-full items-center justify-between text-primary">
      {/* Left links */}
      <div className="flex flex-1 items-center justify-start gap-4">
        {leftLinks.map((navItem) =>
          navItem.linkType === "contact" ? (
            <ContactFormTrigger
              key={navItem._key}
              className={cn(
                buttonVariants({
                  variant: "menu",
                  size: "sm",
                }),
                "transition-colors hover:text-foreground/90 text-foreground/70 h-auto px-0 py-0"
              )}
            >
              {navItem.title}
            </ContactFormTrigger>
          ) : (
            <Link
              key={navItem._key}
              href={navItem.href || "#"}
              target={navItem.target ? "_blank" : undefined}
              rel={navItem.target ? "noopener noreferrer" : undefined}
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
          )
        )}
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
          {rightLinks.map((navItem) =>
            navItem.linkType === "contact" ? (
              <ContactFormTrigger
                key={navItem._key}
                className={cn(
                  buttonVariants({
                    variant: navItem.buttonVariant || "underline",
                    size: "sm",
                  }),
                  "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
                )}
              >
                {navItem.title}
              </ContactFormTrigger>
            ) : (
              <Link
                key={navItem._key}
                href={navItem.href || "#"}
                target={navItem.target ? "_blank" : undefined}
                rel={navItem.target ? "noopener noreferrer" : undefined}
                className={cn(
                  buttonVariants({
                    variant: navItem.buttonVariant || "underline",
                    size: "sm",
                  }),
                  "transition-colors hover:text-foreground/90 text-foreground/70 h-8 px-3 rounded-full"
                )}
              >
                {navItem.title}
              </Link>
            )
          )}
        </div>

        <div className="h-full flex items-center border border-border">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
