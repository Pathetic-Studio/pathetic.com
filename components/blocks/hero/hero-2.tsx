// components/blocks/hero/hero-2.tsx

import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import MouseTrail from "@/components/effects/mouse-trail";
import RotatingImages from "@/components/effects/rotating-images";
import EyeFollow from "@/components/effects/eye-follow";
import ImageExplode from "@/components/effects/image-explode";

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "hero-2" }
>;

const mobileHeightMap: Record<string, string> = {
  auto: "h-auto",
  "50vw": "h-[50vw]",
  full: "h-screen",
};

const desktopHeightMap: Record<string, string> = {
  auto: "md:h-auto",
  "50vw": "md:h-[50vw]",
  full: "md:h-screen",
};

export default function Hero2({
  _key,
  tagLine,
  title,
  body,
  links,
  feature,
  sectionHeightMobile,
  sectionHeightDesktop,
  customHeightMobile,
  customHeightDesktop,
  insetBackground,
}: Hero2Props) {
  const mouseTrailEnabled = feature?.type === "mouseTrail";
  const rotatingImagesEnabled = feature?.type === "rotatingImages";
  const eyeFollowEnabled = feature?.type === "eyeFollow";
  const imageExplodeEnabled = feature?.type === "imageExplode";

  const sectionId = `_hero2-${_key}`;

  const mobileHeight = sectionHeightMobile ?? "auto";
  const desktopHeight = sectionHeightDesktop ?? "auto";

  const baseHeightClass =
    mobileHeight === "custom"
      ? "h-[var(--hero-height-mobile)]"
      : mobileHeightMap[mobileHeight] ?? mobileHeightMap["auto"];

  const desktopHeightClass =
    desktopHeight === "custom"
      ? "md:h-[var(--hero-height-desktop)]"
      : desktopHeightMap[desktopHeight] ?? desktopHeightMap["auto"];

  const heightClass = `${baseHeightClass} ${desktopHeightClass}`;

  let sectionStyle: CSSProperties = {};

  if (mobileHeight === "custom" && customHeightMobile) {
    (sectionStyle as any)["--hero-height-mobile"] = customHeightMobile;
  }

  if (desktopHeight === "custom" && customHeightDesktop) {
    (sectionStyle as any)["--hero-height-desktop"] = customHeightDesktop;
  }

  let insetStyle: CSSProperties | undefined;

  if (insetBackground?.enabled) {
    if (insetBackground.style === "solid" && insetBackground.color) {
      insetStyle = {
        background: insetBackground.color,
      };
    }

    if (
      insetBackground.style === "gradient" &&
      insetBackground.fromColor &&
      insetBackground.toColor
    ) {
      const angle = insetBackground.angle ?? 135;
      insetStyle = {
        backgroundImage: `linear-gradient(${angle}deg, ${insetBackground.fromColor}, ${insetBackground.toColor})`,
      };
    }
  }

  return (
    <section
      id={sectionId}
      className={`relative ${heightClass} overflow-hidden md:overflow-visible`}
      style={sectionStyle}
    >
      {mouseTrailEnabled && (
        <MouseTrail containerId={sectionId} images={feature?.images as any} />
      )}

      {rotatingImagesEnabled && (
        <RotatingImages
          containerId={sectionId}
          images={feature?.images as any}
          animatedIn
          showDotMarker
          showDottedTrack
          mouseControl
          logoSize={80}
        />
      )}

      {eyeFollowEnabled && (
        <EyeFollow containerId={sectionId} eyes={feature?.eyes as any} />
      )}

      {imageExplodeEnabled && (
        <ImageExplode
          containerId={sectionId}
          images={feature?.images as any}
        />
      )}

      {insetBackground?.enabled && insetStyle && (
        <div
          className="pointer-events-none absolute inset-4 md:inset-8 md:top-12 border border-border overflow-hidden -z-10"
          style={insetStyle}
        />
      )}

      <div className="container relative z-10 h-full">
        <div className="h-full flex flex-col justify-center py-20 lg:pt-40 text-center">
          {tagLine && (
            <h1 className="leading-[0] uppercase italic font-sans animate-fade-up [animation-delay:100ms]">
              <span className="text-base font-semibold opacity-50">
                {tagLine}
              </span>
            </h1>
          )}

          {title && (
            <h2 className="mt-2 font-bold scale-x-60 leading-[1.1] uppercase md:text-5xl lg:text-8xl lg:max-w-[28ch] mx-auto animate-fade-up [animation-delay:200ms] opacity-0">
              {title}
            </h2>
          )}

          {body && (
            <div className="text-lg lg:text-2xl mt-6 max-w-2xl mx-auto animate-fade-up [animation-delay:300ms] opacity-0">
              <PortableTextRenderer value={body} />
            </div>
          )}

          {links && links.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-up [animation-delay:400ms] opacity-0">
              {links.map((link) => (
                <Button
                  key={link.title}
                  variant={stegaClean(link?.buttonVariant)}
                  asChild
                >
                  <Link
                    href={link.href || "#"}
                    target={link.target ? "_blank" : undefined}
                    rel={link.target ? "noopener" : undefined}
                  >
                    {link.title}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
