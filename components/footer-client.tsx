// components/footer-client.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";

import { cn } from "@/lib/utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { buttonVariants } from "@/components/ui/button-variants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export type FooterLink = {
  _key: string;
  title?: string | null;
  href?: string | null;
  target?: boolean | null;
  buttonVariant?: string | null;
};

type FooterClientProps = {
  settings: any;
  footerLeftLinks?: FooterLink[] | null;
  footerRightLinks?: FooterLink[] | null;
};

function getActiveScroller(): Window | HTMLElement {
  if (typeof window === "undefined") return {} as Window;

  try {
    const smoother = ScrollSmoother.get();
    const wrapper = smoother?.wrapper?.();
    if (wrapper) return wrapper as HTMLElement;
  } catch { }

  const wrapper = document.getElementById("smooth-wrapper");
  if (wrapper?.getAttribute("data-smooth-active") === "true") {
    return wrapper;
  }

  return window;
}

export default function FooterClient({
  settings,
  footerLeftLinks,
  footerRightLinks,
}: FooterClientProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const linksWrapRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const linksWrap = linksWrapRef.current;
    if (!root || !linksWrap) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(
        "[data-footer-anim]",
        linksWrap,
      );
      if (!items.length) return;

      if (reduceMotion) {
        gsap.set(items, { clearProps: "opacity,transform" });
        return;
      }

      // No FOUC: set initial state before paint
      gsap.set(items, { scale: 0.6, opacity: 0, transformOrigin: "50% 50%" });

      let hasPlayed = false;
      const tl = gsap.timeline({ paused: true });
      tl.to(items, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "power3.out",
        stagger: 0.07,
        clearProps: "transform",
      });

      const trigger = ScrollTrigger.create({
        trigger: linksWrap, // top edge of the links area
        start: "top bottom-=35", // “just above” bottom of viewport
        scroller: getActiveScroller(),
        onEnter: () => {
          hasPlayed = true;
          tl.play();
        },
        onEnterBack: () => {
          hasPlayed = true;
          tl.play();
        },
        onLeaveBack: () => tl.reverse(), // slight scroll up past the start reverses
        onRefresh: (self) => {
          if (self.isActive && !hasPlayed) {
            hasPlayed = true;
            tl.play(0);
          }
        },
        invalidateOnRefresh: true,
      });

      requestAnimationFrame(() => {
        trigger.refresh();
        if (trigger.isActive && !hasPlayed) {
          hasPlayed = true;
          tl.play(0);
        }
      });
    }, root);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={rootRef}>
      <div className="dark:bg-background pb-5 xl:pb-5 text-center">
        <div className="flex flex-col items-center gap-6 text-primary md:flex-row md:justify-between md:px-6 lg:px-10">
          {/* Links wrapper (this is what triggers the animation) */}
          <div
            ref={linksWrapRef}
            className="flex w-full flex-col gap-6 md:flex-row md:items-center md:justify-between"
          >
            {/* Left side */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              {(footerLeftLinks ?? []).map((link) => (
                <Link
                  key={link._key}
                  href={link.href ?? "#"}
                  target={link.target ? "_blank" : undefined}
                  rel={link.target ? "noopener noreferrer" : undefined}
                  data-footer-anim
                  className={cn(
                    buttonVariants({
                      variant: (link.buttonVariant as any) || "menu",
                      size: "sm",
                    }),
                    "transition-colors h-auto px-0 py-0 will-change-transform"
                  )}
                >
                  {link.title}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
              {(footerRightLinks ?? []).map((link) => (
                <Link
                  key={link._key}
                  href={link.href ?? "#"}
                  target={link.target ? "_blank" : undefined}
                  rel={link.target ? "noopener noreferrer" : undefined}
                  data-footer-anim
                  className={cn(
                    buttonVariants({
                      variant: (link.buttonVariant as any) || "default",
                      size: "sm",
                    }),
                    link.buttonVariant === "menu" &&
                    "transition-colors hover:text-foreground/80 text-foreground/60 h-auto px-0 py-0 text-xs hover:bg-transparent",
                    "will-change-transform"
                  )}
                >
                  {link.title}
                </Link>
              ))}
            </div>


            {/* Copyright row */}
            <div className="flex flex-row justify-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xl uppercase text-primary underline-offset-4">
                  &copy; {new Date().getFullYear()}
                </span>
                {settings?.copyright && (
                  <span className="font-semibold text-xl uppercase text-primary underline-offset-4 [&>p]:!m-0">
                    <PortableTextRenderer value={settings.copyright} />
                  </span>
                )}
              </div>
            </div>

          </div>


        </div>
      </div>
    </footer>
  );
}
