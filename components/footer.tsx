import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { fetchSanitySettings, fetchSanityNavigation } from "@/sanity/lib/fetch";
import { NAVIGATION_QUERYResult } from "@/sanity.types";

export default async function Footer() {
  const settings = await fetchSanitySettings();
  const navigation = await fetchSanityNavigation();

  const nav = navigation?.[0];

  const footerLeftLinks = nav?.footerLeftLinks || [];
  const footerRightLinks = nav?.footerRightLinks || [];

  return (
    <footer>
      <div className="dark:bg-background pb-5 xl:pb-5 dark:text-gray-300 text-center">
        {/* Footer nav */}
        <div className="mt-8 flex flex-col items-center gap-6 text-primary md:flex-row md:justify-between md:px-6 lg:px-10">
          {/* Left side */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            {footerLeftLinks.map((link) => (
              <Link
                key={link._key}
                href={link.href || "#"}
                target={link.target ? "_blank" : undefined}
                rel={link.target ? "noopener noreferrer" : undefined}
                className={cn(
                  buttonVariants({
                    variant: link.buttonVariant || "menu",
                    size: "sm",
                  }),
                  "transition-colors hover:text-foreground/80 text-foreground/60 h-auto px-0 py-0 text-xs hover:bg-transparent"
                )}
              >
                {link.title}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            {footerRightLinks.map((link) => (
              <Link
                key={link._key}
                href={link.href || "#"}
                target={link.target ? "_blank" : undefined}
                rel={link.target ? "noopener noreferrer" : undefined}
                className={cn(
                  buttonVariants({
                    variant: link.buttonVariant || "default",
                    size: "sm",
                  }),
                  link.buttonVariant === "menu" &&
                  "transition-colors hover:text-foreground/80 text-foreground/60 h-auto px-0 py-0 text-xs hover:bg-transparent"
                )}
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Copyright row */}
        <div className="mt-8 flex flex-row justify-center gap-6 text-xs lg:mt-5">
          <div className="flex items-center gap-2 text-foreground/60">
            <span>&copy; {new Date().getFullYear()}</span>
            {settings?.copyright && (
              <span className="[&>p]:!m-0">
                <PortableTextRenderer value={settings.copyright} />
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
