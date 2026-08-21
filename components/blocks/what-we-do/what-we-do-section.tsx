"use client";

import type { CSSProperties } from "react";
import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { stegaClean } from "next-sanity";
import type { ColorVariant, PAGE_QUERYResult } from "@/sanity.types";
import { BackgroundPanel } from "@/components/ui/background-panel";
import TypeOnText from "@/components/ui/type-on-text";
import { getSectionSurfaceClass } from "@/components/blocks/shared/section-surface";
import { cn } from "@/lib/utils";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type WhatWeDoBlock = Extract<PageBlock, { _type: "what-we-do-section" }>;
type FloatingProject = NonNullable<WhatWeDoBlock["items"]>[number];

type ItemStyle = CSSProperties & {
  "--item-x": string;
  "--item-y": string;
  "--item-width": string;
  "--item-mobile-x": string;
  "--item-mobile-y": string;
  "--item-mobile-width": string;
};

const DEFAULT_POSITIONS = [
  { x: 11, y: 28, width: 11, mobileX: 24, mobileY: 20, mobileWidth: 30 },
  { x: 22, y: 62, width: 12, mobileX: 72, mobileY: 28, mobileWidth: 32 },
  { x: 38, y: 31, width: 13, mobileX: 28, mobileY: 46, mobileWidth: 34 },
  { x: 55, y: 68, width: 18, mobileX: 72, mobileY: 55, mobileWidth: 40 },
  { x: 72, y: 28, width: 12, mobileX: 28, mobileY: 72, mobileWidth: 32 },
  { x: 84, y: 38, width: 11, mobileX: 72, mobileY: 78, mobileWidth: 30 },
] as const;

const HAND_ASSET_ASPECT_RATIO = 179 / 163;
const DEFAULT_HAND_POINTS = {
  tipX: 12,
  tipY: 27,
  wristX: 82,
  wristY: 79,
} as const;

function getProjectHref(project: FloatingProject["project"]) {
  const slug = stegaClean(project?.slug?.current);
  if (!slug) return null;
  if (project?._type === "post") return `/blog/${slug}`;
  return slug === "index" ? "/" : `/${slug}`;
}

function ProjectMedia({ item }: { item: FloatingProject }) {
  const videoUrl = item.video?.asset?.url;
  const image = item.image?.asset?.url ? item.image : item.project?.image;
  const imageUrl = image?.asset?.url;
  const isCover = stegaClean(item.mediaFit) === "cover";

  if (stegaClean(item.mediaType) === "video" && videoUrl) {
    return (
      <video
        src={videoUrl}
        poster={item.videoPoster?.asset?.url || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className={cn(
          "h-full w-full",
          isCover ? "object-cover" : "object-contain",
        )}
      />
    );
  }

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={item.image?.alt || item.project?.image?.alt || ""}
        fill
        sizes="(min-width: 1024px) 20vw, 40vw"
        className={isCover ? "object-cover" : "object-contain"}
      />
    );
  }

  return <div className="h-full w-full border border-current/20" />;
}

export default function WhatWeDoSection(props: WhatWeDoBlock) {
  const {
    _key,
    anchor,
    padding,
    colorVariant,
    background,
    heading,
    items,
    figure,
  } = props;
  const rootRef = useRef<HTMLElement | null>(null);
  const armPathRef = useRef<SVGPathElement | null>(null);
  const handRef = useRef<HTMLDivElement | null>(null);

  const cleanColor = (stegaClean(colorVariant) || "background") as ColorVariant;
  const cleanAnchor = stegaClean(anchor?.anchorId) || undefined;
  const validItems = (items ?? []).filter(
    (item) =>
      item.image?.asset?.url ||
      item.video?.asset?.url ||
      item.project?.image?.asset?.url,
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const floatingLayers = gsap.utils.toArray<HTMLElement>(
      "[data-what-we-do-float]",
      root,
    );
    const projectLinks = gsap.utils.toArray<HTMLElement>(
      "[data-what-we-do-project]",
      root,
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const context = gsap.context(() => {
      gsap.set(floatingLayers, { rotation: 0, rotationX: 0, rotationY: 0 });

      if (!reduceMotion) {
        floatingLayers.forEach((layer, index) => {
          const amount = Number(layer.dataset.floatAmount || 12);
          const duration = Number(layer.dataset.floatDuration || 5);
          const direction = index % 2 === 0 ? 1 : -1;
          gsap.to(layer, {
            x: direction * amount * 0.42,
            y: direction * amount,
            duration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * -0.37,
          });
        });
      }
    }, root);

    const armPath = armPathRef.current;
    const hand = handRef.current;
    if (!armPath || !hand || !hasFinePointer) {
      return () => context.revert();
    }

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const hoverAim = { x: -1, y: 0 };
    let hoveredProject: HTMLElement | null = null;
    let lastHoveredBounds: DOMRect | null = null;
    let pointerInside = false;
    let focusInside = false;
    let hoverBlend = 0;
    let presence = 0;
    let initialized = false;
    let rotationInitialized = false;
    let smoothedRotationRadians = 0;
    let lastUpdate = performance.now();

    const setRestTarget = () => {
      const bounds = root.getBoundingClientRect();
      const handWidth = figure?.handWidth ?? 110;
      const handHeight = handWidth * HAND_ASSET_ASPECT_RATIO;
      pointer.x =
        bounds.width * ((figure?.shoulderX ?? 88) / 100) - handWidth * 0.34;
      pointer.y =
        bounds.height * ((figure?.shoulderY ?? 76) / 100) - handHeight * 0.12;
      target.x = pointer.x;
      target.y = pointer.y;
      if (!initialized) {
        current.x = pointer.x;
        current.y = pointer.y;
        initialized = true;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = root.getBoundingClientRect();
      pointerInside = true;
      pointer.x = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
      pointer.y = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
      target.x = pointer.x;
      target.y = pointer.y;
    };

    const onPointerLeave = () => {
      hoveredProject = null;
      pointerInside = false;
      if (!focusInside) setRestTarget();
    };

    const projectListeners = projectLinks.map((project) => {
      const onEnter = (event: Event) => {
        const rootBounds = root.getBoundingClientRect();
        const projectBounds = project.getBoundingClientRect();
        hoveredProject = project;

        if (event instanceof PointerEvent) {
          pointerInside = true;
          pointer.x = Math.max(
            0,
            Math.min(rootBounds.width, event.clientX - rootBounds.left),
          );
          pointer.y = Math.max(
            0,
            Math.min(rootBounds.height, event.clientY - rootBounds.top),
          );
          target.x = pointer.x;
          target.y = pointer.y;
        } else {
          focusInside = true;
          pointer.x =
            projectBounds.left - rootBounds.left + projectBounds.width / 2;
          pointer.y =
            projectBounds.top - rootBounds.top + projectBounds.height / 2;
          target.x = pointer.x;
          target.y = pointer.y;
        }
      };
      const onLeave = (event: Event) => {
        if (hoveredProject !== project) return;
        hoveredProject = null;
        if (event.type === "blur") focusInside = false;
        if (pointerInside || focusInside) {
          target.x = pointer.x;
          target.y = pointer.y;
        } else {
          setRestTarget();
        }
      };
      project.addEventListener("pointerenter", onEnter);
      project.addEventListener("pointerleave", onLeave);
      project.addEventListener("focus", onEnter);
      project.addEventListener("blur", onLeave);
      return { project, onEnter, onLeave };
    });

    setRestTarget();
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);

    const updateArm = () => {
      const updateTime = performance.now();
      const deltaSeconds = Math.min(0.05, (updateTime - lastUpdate) / 1000);
      lastUpdate = updateTime;
      const bounds = root.getBoundingClientRect();
      const originX = bounds.width * ((figure?.shoulderX ?? 88) / 100);
      const originY = bounds.height * ((figure?.shoulderY ?? 76) / 100);
      const followAlpha = reduceMotion
        ? 1
        : 1 - Math.exp(-deltaSeconds * 11.5);
      const stateAlpha = reduceMotion
        ? 1
        : 1 - Math.exp(-deltaSeconds * 8.5);
      current.x += (target.x - current.x) * followAlpha;
      current.y += (target.y - current.y) * followAlpha;
      presence +=
        ((pointerInside || focusInside ? 1 : 0) - presence) * stateAlpha;
      hoverBlend += ((hoveredProject ? 1 : 0) - hoverBlend) * stateAlpha;

      const freeAimX = current.x - originX;
      const freeAimY = current.y - originY;
      let aimX = freeAimX;
      let aimY = freeAimY;
      let aimDistance = Math.max(1, Math.hypot(aimX, aimY));
      aimX /= aimDistance;
      aimY /= aimDistance;

      let hoveredBounds =
        hoverBlend > 0.001 ? lastHoveredBounds : null;
      if (hoveredProject) {
        const projectBounds = hoveredProject.getBoundingClientRect();
        hoveredBounds = projectBounds;
        lastHoveredBounds = projectBounds;
        const towardCenterX =
          projectBounds.left - bounds.left + projectBounds.width / 2 - current.x;
        const towardCenterY =
          projectBounds.top - bounds.top + projectBounds.height / 2 - current.y;
        aimDistance = Math.hypot(towardCenterX, towardCenterY);

        if (aimDistance > 4) {
          const hoverAimX = towardCenterX / aimDistance;
          const hoverAimY = towardCenterY / aimDistance;
          const aimAlpha = Math.min(1, stateAlpha * 1.8);
          hoverAim.x += (hoverAimX - hoverAim.x) * aimAlpha;
          hoverAim.y += (hoverAimY - hoverAim.y) * aimAlpha;
        }
      }

      aimX += (hoverAim.x - aimX) * hoverBlend;
      aimY += (hoverAim.y - aimY) * hoverBlend;
      const blendedAimDistance = Math.max(1, Math.hypot(aimX, aimY));
      aimX /= blendedAimDistance;
      aimY /= blendedAimDistance;

      const handWidth = figure?.handWidth ?? 110;
      const handHeight = handWidth * HAND_ASSET_ASPECT_RATIO;
      const tipX = (figure?.handTipX ?? DEFAULT_HAND_POINTS.tipX) / 100;
      const tipY = (figure?.handTipY ?? DEFAULT_HAND_POINTS.tipY) / 100;
      const wristX = (figure?.handWristX ?? DEFAULT_HAND_POINTS.wristX) / 100;
      const wristY = (figure?.handWristY ?? DEFAULT_HAND_POINTS.wristY) / 100;
      const naturalFingerAngle = Math.atan2(
        (tipY - wristY) * handHeight,
        (tipX - wristX) * handWidth,
      );
      const rotationOffsetRadians =
        ((figure?.handRotationOffset ?? 0) * Math.PI) / 180;
      const desiredRotationRadians =
        Math.atan2(aimY, aimX) -
        naturalFingerAngle +
        rotationOffsetRadians;
      if (!rotationInitialized || reduceMotion) {
        smoothedRotationRadians = desiredRotationRadians;
        rotationInitialized = true;
      } else {
        const angularDelta = Math.atan2(
          Math.sin(desiredRotationRadians - smoothedRotationRadians),
          Math.cos(desiredRotationRadians - smoothedRotationRadians),
        );
        const rotationAlpha = 1 - Math.exp(-deltaSeconds * 8);
        const maximumStep = deltaSeconds * 4.5;
        const rotationStep = Math.max(
          -maximumStep,
          Math.min(maximumStep, angularDelta * rotationAlpha),
        );
        smoothedRotationRadians += rotationStep;
      }
      const rotationRadians = smoothedRotationRadians;
      const smoothedAimAngle =
        rotationRadians + naturalFingerAngle - rotationOffsetRadians;
      aimX = Math.cos(smoothedAimAngle);
      aimY = Math.sin(smoothedAimAngle);
      const wristOffsetX = (wristX - tipX) * handWidth;
      const wristOffsetY = (wristY - tipY) * handHeight;
      const armEndX =
        current.x +
        wristOffsetX * Math.cos(rotationRadians) -
        wristOffsetY * Math.sin(rotationRadians);
      const armEndY =
        current.y +
        wristOffsetX * Math.sin(rotationRadians) +
        wristOffsetY * Math.cos(rotationRadians);

      const deltaX = armEndX - originX;
      const deltaY = armEndY - originY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const normalX = -deltaY / distance;
      const normalY = deltaX / distance;
      const now = performance.now() * 0.001;
      const bend = reduceMotion
        ? 0
        : Math.sin(now * 1.7) * Math.min(48, distance * 0.06);
      const counterBend = reduceMotion
        ? 0
        : Math.cos(now * 2.25 + distance * 0.008) *
          Math.min(28, distance * 0.04);
      const baseSlink = reduceMotion ? 0 : Math.min(135, distance * 0.17);
      const controlOneOffset = baseSlink + bend;
      const controlTwoOffset =
        baseSlink * 0.92 - bend * 0.65 + counterBend;
      let controlOneX =
        originX + deltaX * 0.28 + normalX * controlOneOffset;
      let controlOneY =
        originY + deltaY * 0.28 + normalY * controlOneOffset;
      let controlTwoX =
        originX + deltaX * 0.7 - normalX * controlTwoOffset;
      let controlTwoY =
        originY + deltaY * 0.7 - normalY * controlTwoOffset;

      if (hoveredBounds) {
        const avoidanceStrength = Math.max(0, Math.min(1, hoverBlend));
        const centerX =
          hoveredBounds.left - bounds.left + hoveredBounds.width / 2;
        const centerY =
          hoveredBounds.top - bounds.top + hoveredBounds.height / 2;
        let outwardX = current.x - centerX;
        let outwardY = current.y - centerY;
        const outwardDistance = Math.hypot(outwardX, outwardY);
        if (outwardDistance > 2) {
          outwardX /= outwardDistance;
          outwardY /= outwardDistance;
        } else {
          outwardX = -aimX;
          outwardY = -aimY;
        }

        const originFromCenterX = originX - centerX;
        const originFromCenterY = originY - centerY;
        const pointerFromCenterX = current.x - centerX;
        const pointerFromCenterY = current.y - centerY;
        const crossesProject =
          originFromCenterX * pointerFromCenterX +
            originFromCenterY * pointerFromCenterY <
          0;
        const centerSide =
          normalX * (centerX - originX) + normalY * (centerY - originY);
        const routeSign = centerSide >= 0 ? -1 : 1;
        const routeX = normalX * routeSign;
        const routeY = normalY * routeSign;
        const avoidance = Math.min(
          285,
          (Math.max(hoveredBounds.width, hoveredBounds.height) * 0.72 +
            handWidth * 0.52) *
            (crossesProject ? 1.45 : 1),
        );

        controlOneX +=
          (routeX * avoidance * (crossesProject ? 0.8 : 0.48) +
            outwardX * avoidance * 0.24) *
          avoidanceStrength;
        controlOneY +=
          (routeY * avoidance * (crossesProject ? 0.8 : 0.48) +
            outwardY * avoidance * 0.24) *
          avoidanceStrength;
        const avoidedControlTwoX =
          armEndX +
          outwardX * avoidance * 1.12 +
          routeX * avoidance * (crossesProject ? 0.64 : 0.32);
        const avoidedControlTwoY =
          armEndY +
          outwardY * avoidance * 1.12 +
          routeY * avoidance * (crossesProject ? 0.64 : 0.32);
        controlTwoX +=
          (avoidedControlTwoX - controlTwoX) * avoidanceStrength;
        controlTwoY +=
          (avoidedControlTwoY - controlTwoY) * avoidanceStrength;
      }

      const windAmount =
        (1 - presence) * Math.min(76, Math.max(42, handWidth * 0.62));
      controlOneX += normalX * windAmount;
      controlOneY += normalY * windAmount;
      controlTwoX -= normalX * windAmount * 0.78;
      controlTwoY -= normalY * windAmount * 0.78;

      const shoulderHalfWidth = Math.max(2, (figure?.armWidth ?? 34) * 0.14);
      const handHalfWidth = (figure?.armWidth ?? 34) * 0.55;
      const pathData = [
        `M ${originX + normalX * shoulderHalfWidth} ${originY + normalY * shoulderHalfWidth}`,
        `C ${controlOneX + normalX * shoulderHalfWidth} ${controlOneY + normalY * shoulderHalfWidth},`,
        `${controlTwoX + normalX * handHalfWidth} ${controlTwoY + normalY * handHalfWidth},`,
        `${armEndX + normalX * handHalfWidth} ${armEndY + normalY * handHalfWidth}`,
        `L ${armEndX - normalX * handHalfWidth} ${armEndY - normalY * handHalfWidth}`,
        `C ${controlTwoX - normalX * handHalfWidth} ${controlTwoY - normalY * handHalfWidth},`,
        `${controlOneX - normalX * shoulderHalfWidth} ${controlOneY - normalY * shoulderHalfWidth},`,
        `${originX - normalX * shoulderHalfWidth} ${originY - normalY * shoulderHalfWidth}`,
        "Z",
      ].join(" ");
      armPath.setAttribute("d", pathData);

      gsap.set(hand, {
        x: current.x,
        y: current.y,
        xPercent: -tipX * 100,
        yPercent: -tipY * 100,
        rotation: (rotationRadians * 180) / Math.PI,
        transformOrigin: `${tipX * 100}% ${tipY * 100}%`,
        force3D: true,
      });
    };

    updateArm();
    gsap.ticker.add(updateArm);

    return () => {
      gsap.ticker.remove(updateArm);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      projectListeners.forEach(({ project, onEnter, onLeave }) => {
        project.removeEventListener("pointerenter", onEnter);
        project.removeEventListener("pointerleave", onLeave);
        project.removeEventListener("focus", onEnter);
        project.removeEventListener("blur", onLeave);
      });
      context.revert();
    };
  }, [figure, validItems.length]);

  return (
    <section
      ref={rootRef}
      id={cleanAnchor || `_what-we-do-${_key}`}
      className={cn(
        "relative isolate h-[100svh] min-h-[100svh] overflow-hidden",
        getSectionSurfaceClass(cleanColor),
        padding?.top ? "pt-16 xl:pt-20" : undefined,
        padding?.bottom ? "pb-16 xl:pb-20" : undefined,
      )}
    >
      <BackgroundPanel background={background} className="!border-0" />

      <div className="relative mx-auto h-full min-h-0 max-w-[1800px]">
        {heading && (
          <h2 className="absolute left-1/2 top-[8%] z-20 -translate-x-1/2 whitespace-nowrap text-center text-base font-bold uppercase md:top-[17%] md:text-xl">
            {stegaClean(heading)}
          </h2>
        )}

        <div className="absolute inset-0 z-20">
          {validItems.map((item, index) => {
            const fallback = DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length];
            const style: ItemStyle = {
              "--item-x": `${item.positionX ?? fallback.x}%`,
              "--item-y": `${item.positionY ?? fallback.y}%`,
              "--item-width": `${item.width ?? fallback.width}%`,
              "--item-mobile-x": `${item.mobilePositionX ?? fallback.mobileX}%`,
              "--item-mobile-y": `${item.mobilePositionY ?? fallback.mobileY}%`,
              "--item-mobile-width": `${item.mobileWidth ?? fallback.mobileWidth}%`,
              zIndex: 20 + index,
            };
            const title = stegaClean(item.titleOverride || item.project?.title) || "View project";
            const href = getProjectHref(item.project);
            const projectContent = (
              <div
                data-what-we-do-float
                data-float-amount={item.floatAmount ?? 12}
                data-float-duration={item.floatDuration ?? 5}
                className="relative will-change-transform"
              >
                <div className="relative aspect-[4/3] w-full transition-transform duration-300 ease-out group-hover:scale-105 group-focus-visible:scale-105">
                  <ProjectMedia item={item} />
                </div>
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-sm font-bold uppercase md:text-base">
                  <TypeOnText text={title} trigger="hover" speed={1.35} />
                </span>
              </div>
            );
            const projectClassName =
              "group absolute left-[var(--item-mobile-x)] top-[var(--item-mobile-y)] w-[var(--item-mobile-width)] -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none md:left-[var(--item-x)] md:top-[var(--item-y)] md:w-[var(--item-width)]";

            return href ? (
              <Link
                key={item._key}
                href={href}
                data-what-we-do-project
                data-typeon-hover="true"
                className={projectClassName}
                style={style}
                aria-label={`View ${title}`}
              >
                {projectContent}
              </Link>
            ) : (
              <div
                key={item._key}
                data-what-we-do-project
                data-typeon-hover="true"
                className={projectClassName}
                style={style}
              >
                {projectContent}
              </div>
            );
          })}
        </div>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 hidden h-full w-full overflow-visible md:block"
        >
          {figure?.armImage?.asset?.url && (
            <defs>
              <pattern
                id={`what-we-do-arm-${_key}`}
                width="1"
                height="1"
                patternUnits="objectBoundingBox"
                patternContentUnits="objectBoundingBox"
              >
                <rect
                  width="1"
                  height="1"
                  fill={stegaClean(figure?.armColor) || "#2d2d2d"}
                />
                <image
                  href={figure.armImage.asset.url}
                  y="-0.35"
                  width="1"
                  height="1.52"
                  preserveAspectRatio="none"
                  opacity="0.78"
                />
              </pattern>
            </defs>
          )}
          <path
            ref={armPathRef}
            fill={
              figure?.armImage?.asset?.url
                ? `url(#what-we-do-arm-${_key})`
                : stegaClean(figure?.armColor) || "#2d2d2d"
            }
          />
        </svg>

        <div
          ref={handRef}
          data-what-we-do-hand
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-50 hidden origin-center will-change-transform md:block"
          style={{ width: `${figure?.handWidth ?? 110}px` }}
        >
          {figure?.handImage?.asset?.url ? (
            <Image
              src={figure.handImage.asset.url}
              alt=""
              width={figure.handWidth ?? 110}
              height={figure.handWidth ?? 110}
              className="h-auto w-full object-contain"
            />
          ) : (
            <span className="block text-[clamp(3rem,7vw,7rem)] leading-none grayscale">
              ☞
            </span>
          )}
          <span
            data-what-we-do-fingertip
            className="pointer-events-none absolute h-px w-px opacity-0"
            style={{
              left: `${figure?.handTipX ?? DEFAULT_HAND_POINTS.tipX}%`,
              top: `${figure?.handTipY ?? DEFAULT_HAND_POINTS.tipY}%`,
            }}
          />
          <span
            data-what-we-do-wrist
            className="pointer-events-none absolute h-px w-px opacity-0"
            style={{
              left: `${figure?.handWristX ?? DEFAULT_HAND_POINTS.wristX}%`,
              top: `${figure?.handWristY ?? DEFAULT_HAND_POINTS.wristY}%`,
            }}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 z-40 hidden -translate-x-1/2 md:block"
          style={{
            left: `${figure?.personX ?? 88}%`,
            width: `${figure?.personWidth ?? 9}%`,
          }}
        >
          {figure?.personImage?.asset?.url ? (
            <Image
              src={figure.personImage.asset.url}
              alt=""
              width={420}
              height={620}
              className="h-auto w-full object-contain"
            />
          ) : (
            <span className="block origin-bottom-left -scale-x-100 text-[clamp(4rem,8vw,8rem)] leading-none grayscale">
              🧎
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
