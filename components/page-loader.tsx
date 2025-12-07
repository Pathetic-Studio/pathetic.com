// components/page-loader.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import LogoAnimated from "@/components/logo-animated";

type PageLoaderProps = {
  enabled?: boolean;
  oncePerSession?: boolean;
  imageSources: string[];
};

export default function PageLoader({
  enabled = true,
  oncePerSession = true,
  imageSources,
}: PageLoaderProps) {
  const [active, setActive] = useState(false);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const imageRefs = useRef<HTMLDivElement[]>([]);
  const logoWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    if (oncePerSession) {
      const hasPlayed = window.sessionStorage.getItem("loaderPlayed");
      if (hasPlayed) return;
    }

    setActive(true);
  }, [enabled, oncePerSession]);

  useLayoutEffect(() => {
    if (!active) return;
    if (!loaderRef.current) return;

    const ctx = gsap.context(() => {
      const headerLogo = document.getElementById("header-logo-main");

      if (headerLogo) {
        gsap.set(headerLogo, { opacity: 0 });
      }

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          if (typeof window !== "undefined" && oncePerSession) {
            window.sessionStorage.setItem("loaderPlayed", "true");
          }

          gsap.to(loaderRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => setActive(false),
          });
        },
      });

      // Initial states
      gsap.set(imageRefs.current, {
        scale: 0,
        opacity: 0,
        transformOrigin: "50% 50%",
      });

      gsap.set(logoWrapperRef.current, {
        scale: 1,
        x: 0,
        y: 0,
        transformOrigin: "50% 50%",
      });

      // Each SVG path = one "letter"
      const letterNodes =
        (logoWrapperRef.current?.querySelectorAll("path") as
          | NodeListOf<SVGPathElement>
          | undefined) ?? [];

      gsap.set(letterNodes, { autoAlpha: 0 });

      // 1) Images pop in
      tl.to(imageRefs.current, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        stagger: 0.07,
        ease: "back.out(1.7)",
      });

      // 2) Images pop out
      tl.to(imageRefs.current, {
        scale: 0.2,
        opacity: 0,
        duration: 0.25,
        stagger: 0.05,
        ease: "power2.in",
      });

      // 3) LETTER TYPING — sequential instant-on
      tl.to(letterNodes, {
        autoAlpha: 1,
        duration: 0,
        stagger: 0.05,
        ease: "none",
      });

      // 3.5) PAUSE HERE
      tl.to({}, { duration: 0.4 });

      // 4) Move + scale logo to header logo
      let dx = 0;
      let dy = -200;
      let scale = 0.35;

      if (headerLogo && logoWrapperRef.current) {
        const srcRect = logoWrapperRef.current.getBoundingClientRect();
        const destRect = headerLogo.getBoundingClientRect();

        const srcCx = srcRect.left + srcRect.width / 2;
        const srcCy = srcRect.top + srcRect.height / 2;
        const destCx = destRect.left + destRect.width / 2;
        const destCy = destRect.top + destRect.height / 2;

        dx = destCx - srcCx;
        dy = destCy - srcCy;

        if (srcRect.width > 0) {
          scale = destRect.width / srcRect.width;
        }
      }

      tl.to(logoWrapperRef.current, {
        x: dx,
        y: dy,
        scale,
        duration: 0.8,
        ease: "power3.inOut",
      });

      // 5) Fade in actual header logo
      if (headerLogo) {
        tl.to(
          headerLogo,
          { opacity: 1, duration: 0.4, ease: "power2.out" },
          "-=0.4"
        );
      }
    }, loaderRef);

    return () => ctx.revert();
  }, [active, oncePerSession]);

  if (!active) return null;

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative h-[150px] w-[150px] mb-10">
          {imageSources.slice(0, 3).map((src, index) => (
            <div
              key={index}
              ref={(el) => {
                if (el) {
                  imageRefs.current[index] = el;
                }
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src={src}
                alt=""
                fill
                priority
                className="object-contain"
              />
            </div>
          ))}
        </div>

        <div
          ref={logoWrapperRef}
          className="flex items-center justify-center will-change-transform"
        >
          <LogoAnimated className="w-[600px] max-w-[90vw] text-black dark:text-foreground" />
        </div>
      </div>
    </div>
  );
}
