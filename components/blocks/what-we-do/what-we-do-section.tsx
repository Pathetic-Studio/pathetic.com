"use client";

import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { ColorVariant, PAGE_QUERYResult } from "@/sanity.types";
import { BackgroundPanel } from "@/components/ui/background-panel";
import TypeOnText, { TYPE_ON_SPEEDS } from "@/components/ui/type-on-text";
import { getSectionSurfaceClass } from "@/components/blocks/shared/section-surface";
import { cn } from "@/lib/utils";
import WorkContentViewer, {
  type WorkViewerContent,
} from "./work-content-viewer";

gsap.registerPlugin(ScrollTrigger);

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type WhatWeDoBlock = Extract<PageBlock, { _type: "what-we-do-section" }>;
type FloatingProject = NonNullable<WhatWeDoBlock["items"]>[number];

type ResolvedFloatingProject = {
  _key: string;
  title: string;
  href: string | null;
  target?: boolean | null;
  interactionMode: "link" | "reveal" | "fullscreen";
  revealTitle?: string;
  revealDescription?: string;
  expandedMediaType?: "image" | "video";
  expandedImageUrl?: string;
  expandedImageAlt?: string;
  expandedVideoUrl?: string;
  expandedVideoPosterUrl?: string;
  mediaType: "image" | "video";
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  mediaFit: "contain" | "cover";
  positionX?: number | null;
  positionY?: number | null;
  width?: number | null;
  mobilePositionX?: number | null;
  mobilePositionY?: number | null;
  mobileWidth?: number | null;
  floatAmount?: number | null;
  floatDuration?: number | null;
  aspectRatio?: "landscape" | "portrait";
};

type SizzleReelSettings = {
  enabled?: boolean | null;
  label?: string | null;
  href?: string | null;
  video?: { asset?: { url?: string | null } | null } | null;
  videoPoster?: { asset?: { url?: string | null } | null } | null;
  fireGif?: { asset?: { url?: string | null } | null } | null;
};

type ItemStyle = CSSProperties & {
  "--item-x": string;
  "--item-y": string;
  "--item-width": string;
  "--item-mobile-x": string;
  "--item-mobile-y": string;
  "--item-mobile-width": string;
  "--item-tablet-x": string;
  "--item-tablet-y": string;
  "--item-tablet-width": string;
};

const DEFAULT_POSITIONS = [
  { x: 11, y: 28, width: 11, mobileX: 24, mobileY: 20, mobileWidth: 30 },
  { x: 22, y: 62, width: 12, mobileX: 72, mobileY: 28, mobileWidth: 32 },
  { x: 38, y: 31, width: 13, mobileX: 28, mobileY: 46, mobileWidth: 34 },
  { x: 55, y: 68, width: 18, mobileX: 72, mobileY: 55, mobileWidth: 40 },
  { x: 72, y: 28, width: 12, mobileX: 28, mobileY: 72, mobileWidth: 32 },
  { x: 84, y: 38, width: 11, mobileX: 72, mobileY: 78, mobileWidth: 30 },
] as const;

const TABLET_POSITIONS = [
  { x: 14, y: 35, width: 13 },
  { x: 38, y: 44, width: 12 },
  { x: 64, y: 34, width: 13 },
  { x: 86, y: 49, width: 15 },
  { x: 21, y: 69, width: 13 },
  { x: 52, y: 73, width: 12 },
  { x: 80, y: 76, width: 13 },
  { x: 39, y: 85, width: 13 },
] as const;

const MOBILE_POSITIONS = [
  { x: 25, y: 35, width: 25 },
  { x: 73, y: 37, width: 22 },
  { x: 27, y: 51, width: 23 },
  { x: 72, y: 53, width: 27 },
  { x: 25, y: 68, width: 24 },
  { x: 73, y: 69, width: 22 },
  { x: 27, y: 83, width: 23 },
  { x: 72, y: 84, width: 24 },
] as const;

const DEFAULT_HAND_POINTS = {
  tipX: 12,
  tipY: 27,
  wristX: 82,
  wristY: 79,
} as const;
const GENERATED_HAND_POINTS = {
  tipX: 19.2,
  tipY: 18.1,
  wristX: 79.5,
  wristY: 75.8,
} as const;
const GENERATED_BODY_SRC = "/images/what-we-do/bendy-man-body-v2.png";
const GENERATED_HAND_SRC = "/images/what-we-do/bendy-man-hand-v2.png";
const GENERATED_BODY_SOCKET = { x: 33.8, y: 32.4 } as const;
const GENERATED_HAND_CUFF_OUTWARD_ANGLE = (34 * Math.PI) / 180;
const ARM_FILL = "#000000";
const SIZZLE_FIRE_SRC = "/images/what-we-do/sizzle-fire-9987911.gif";
const DEFAULT_CASE_STUDY_HREF = "/case-study";

const LOCAL_FLOATING_PROJECTS: ResolvedFloatingProject[] = [
  {
    _key: "local-sandbar",
    title: "SANDBAR",
    href: "/case-study",
    interactionMode: "link",
    mediaType: "image",
    imageUrl: "/images/what-we-do/sandbar.png",
    imageAlt: "Sandbar smart ring",
    mediaFit: "contain",
    positionX: 70,
    positionY: 32,
    width: 10,
    mobilePositionX: 71,
    mobilePositionY: 31,
    mobileWidth: 25,
    floatAmount: 9,
    floatDuration: 5.8,
  },
  {
    _key: "local-video-01",
    title: "FILM 01",
    href: null,
    interactionMode: "fullscreen",
    mediaType: "video",
    videoUrl: "/images/what-we-do/placeholder-loop-01.m4v",
    expandedMediaType: "video",
    expandedVideoUrl: "/images/what-we-do/placeholder-loop-01.m4v",
    mediaFit: "cover",
    positionX: 18,
    positionY: 67,
    width: 8.5,
    mobilePositionX: 28,
    mobilePositionY: 66,
    mobileWidth: 24,
    floatAmount: 7,
    floatDuration: 6.4,
    aspectRatio: "portrait",
  },
  {
    _key: "local-video-02",
    title: "FILM 02",
    href: null,
    interactionMode: "fullscreen",
    mediaType: "video",
    videoUrl: "/images/what-we-do/placeholder-loop-02.m4v",
    expandedMediaType: "video",
    expandedVideoUrl: "/images/what-we-do/placeholder-loop-02.m4v",
    mediaFit: "cover",
    positionX: 86,
    positionY: 30,
    width: 8,
    mobilePositionX: 73,
    mobilePositionY: 42,
    mobileWidth: 23,
    floatAmount: 8,
    floatDuration: 5.7,
    aspectRatio: "portrait",
  },
];

const CURATED_ITEM_LAYOUT: Record<
  string,
  Pick<ResolvedFloatingProject, "positionX" | "positionY" | "width">
> = {
  whatWeDoRamp: { positionX: 10, positionY: 29, width: 9 },
  whatWeDoDoorDash: { positionX: 33, positionY: 35, width: 10.5 },
  whatWeDoAdidas: { positionX: 58, positionY: 68, width: 22 },
};

type ArmPoint = {
  x: number;
  y: number;
  halfWidth: number;
  normalX?: number;
  normalY?: number;
};

function cubicPoint(
  start: Pick<ArmPoint, "x" | "y">,
  controlOne: Pick<ArmPoint, "x" | "y">,
  controlTwo: Pick<ArmPoint, "x" | "y">,
  end: Pick<ArmPoint, "x" | "y">,
  progress: number,
) {
  const inverse = 1 - progress;
  const inverseSquared = inverse * inverse;
  const progressSquared = progress * progress;

  return {
    x:
      inverseSquared * inverse * start.x +
      3 * inverseSquared * progress * controlOne.x +
      3 * inverse * progressSquared * controlTwo.x +
      progressSquared * progress * end.x,
    y:
      inverseSquared * inverse * start.y +
      3 * inverseSquared * progress * controlOne.y +
      3 * inverse * progressSquared * controlTwo.y +
      progressSquared * progress * end.y,
  };
}

function buildArmOutline(points: ArmPoint[]) {
  const upper: Array<{ x: number; y: number }> = [];
  const lower: Array<{ x: number; y: number }> = [];

  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tangentX = next.x - previous.x;
    const tangentY = next.y - previous.y;
    const tangentLength = Math.max(0.001, Math.hypot(tangentX, tangentY));
    const normalX =
      point.normalX === undefined ? -tangentY / tangentLength : point.normalX;
    const normalY =
      point.normalY === undefined ? tangentX / tangentLength : point.normalY;

    upper.push({
      x: point.x + normalX * point.halfWidth,
      y: point.y + normalY * point.halfWidth,
    });
    lower.push({
      x: point.x - normalX * point.halfWidth,
      y: point.y - normalY * point.halfWidth,
    });
  });

  return [
    `M ${upper[0].x} ${upper[0].y}`,
    ...upper.slice(1).map((point) => `L ${point.x} ${point.y}`),
    ...lower.reverse().map((point) => `L ${point.x} ${point.y}`),
    "Z",
  ].join(" ");
}

function getProjectHref(project: FloatingProject["project"]) {
  if (project?._type === "caseStudy") return "/case-study";
  const slug = stegaClean(project?.slug?.current);
  if (!slug) return null;
  if (project?._type === "post") return `/blog/${slug}`;
  return slug === "index" ? "/" : `/${slug}`;
}

function ProjectMedia({ item }: { item: ResolvedFloatingProject }) {
  const isCover = item.mediaFit === "cover";
  const [loadVideo, setLoadVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (item.mediaType !== "video" || !item.videoUrl) return;

    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
    if (!touch) {
      setLoadVideo(true);
      return undefined;
    }

    // Touch layouts keep the lightweight poster in the composition. The same
    // source is loaded only after the user opens the fullscreen viewer, which
    // avoids a pair of video decodes competing with the section entrance.
    setLoadVideo(false);
    return undefined;
  }, [item.mediaType, item.videoUrl]);

  if (item.mediaType === "video" && item.videoUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#dadada]">
        {item.videoPosterUrl ? (
          <Image
            src={item.videoPosterUrl}
            alt={item.imageAlt || item.title}
            fill
            loading="eager"
            sizes="(min-width: 1024px) 20vw, 44vw"
            className={isCover ? "object-cover" : "object-contain"}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(145deg,#efefef,#b9b9b9)] text-center text-xs font-bold uppercase tracking-[.12em] text-black/55">
            {item.title}
          </div>
        )}
        {loadVideo && (
          <video
            src={item.videoUrl}
            poster={item.videoPosterUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            className={cn(
              "relative h-full w-full transition-opacity duration-200",
              videoReady ? "opacity-100" : "opacity-0",
              isCover ? "object-cover" : "object-contain",
            )}
          />
        )}
      </div>
    );
  }

  if (item.imageUrl) {
    return (
      <Image
        src={item.imageUrl}
        alt={item.imageAlt || ""}
        fill
        loading="eager"
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
  const bodySocketRef = useRef<HTMLSpanElement | null>(null);
  const [activeRevealKey, setActiveRevealKey] = useState<string | null>(null);
  const [touchLayout, setTouchLayout] = useState(false);
  const [viewerContent, setViewerContent] =
    useState<WorkViewerContent | null>(null);
  const closeViewer = useCallback(() => setViewerContent(null), []);

  useEffect(() => {
    const update = () =>
      setTouchLayout(
        window.innerWidth < 1024 ||
        window.matchMedia("(pointer: coarse)").matches ||
          navigator.maxTouchPoints > 0,
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cleanColor = (stegaClean(colorVariant) || "background") as ColorVariant;
  const cleanAnchor = stegaClean(anchor?.anchorId) || undefined;
  const sectionSettings = props as WhatWeDoBlock & {
    sizzleReel?: SizzleReelSettings | null;
  };
  const sizzleReel = sectionSettings.sizzleReel;
  const showSizzleReel = stegaClean(sizzleReel?.enabled) !== false;
  const sizzleLabel = stegaClean(sizzleReel?.label) || "SIZZLE REEL";
  const sizzleVideoUrl =
    sizzleReel?.video?.asset?.url ||
    "/images/what-we-do/placeholder-loop-01.m4v";
  const sizzleVideoPosterUrl = sizzleReel?.videoPoster?.asset?.url || undefined;
  const sizzleFireSrc =
    sizzleReel?.fireGif?.asset?.url || SIZZLE_FIRE_SRC;
  const validItems: ResolvedFloatingProject[] = (items ?? [])
    .filter((item) => {
      const itemName = stegaClean(
        item.titleOverride || item.project?.title || item._key,
      ).toLowerCase();
      const hasMedia =
        item.image?.asset?.url ||
        item.video?.asset?.url ||
        item.project?.image?.asset?.url;
      return (
        Boolean(hasMedia) &&
        !itemName.includes("flower") &&
        !itemName.includes("bless")
      );
    })
    .map((item) => {
      const image = item.image?.asset?.url ? item.image : item.project?.image;
      const title =
        stegaClean(item.titleOverride || item.project?.title) || "View project";
      const curatedLayout = CURATED_ITEM_LAYOUT[item._key];
      const mediaType =
        stegaClean(item.mediaType) === "video" ? "video" : "image";
      const destinationHref = stegaClean(item.destination?.href) || null;
      const referencedHref = getProjectHref(item.project);
      const href =
        destinationHref ||
        referencedHref ||
        (mediaType === "image" ? DEFAULT_CASE_STUDY_HREF : null);
      const requestedMode = stegaClean(item.interactionMode);
      const interactionMode: ResolvedFloatingProject["interactionMode"] =
        requestedMode === "reveal" || requestedMode === "fullscreen"
          ? requestedMode
          : requestedMode === "link"
            ? "link"
            : mediaType === "video"
              ? "fullscreen"
              : "link";
      const expandedChoice = stegaClean(item.expandedMediaType) || "same";
      const expandedMediaType: "image" | "video" =
        expandedChoice === "video"
          ? "video"
          : expandedChoice === "image"
            ? "image"
            : mediaType;

      return {
        _key: item._key,
        title,
        href,
        target: item.destination?.target,
        interactionMode,
        revealTitle: stegaClean(item.revealTitle) || title,
        revealDescription: stegaClean(item.revealDescription) || undefined,
        expandedMediaType,
        expandedImageUrl:
          item.expandedImage?.asset?.url || image?.asset?.url || undefined,
        expandedImageAlt:
          item.expandedImage?.alt ||
          item.image?.alt ||
          item.project?.image?.alt ||
          "",
        expandedVideoUrl:
          item.expandedVideo?.asset?.url || item.video?.asset?.url || undefined,
        expandedVideoPosterUrl:
          item.expandedVideoPoster?.asset?.url ||
          item.videoPoster?.asset?.url ||
          undefined,
        mediaType,
        imageUrl: image?.asset?.url || undefined,
        imageAlt: item.image?.alt || item.project?.image?.alt || "",
        videoUrl: item.video?.asset?.url || undefined,
        videoPosterUrl: item.videoPoster?.asset?.url || undefined,
        mediaFit: stegaClean(item.mediaFit) === "cover" ? "cover" : "contain",
        positionX: curatedLayout?.positionX ?? item.positionX,
        positionY: curatedLayout?.positionY ?? item.positionY,
        width: curatedLayout?.width ?? item.width,
        mobilePositionX: item.mobilePositionX,
        mobilePositionY: item.mobilePositionY,
        mobileWidth: item.mobileWidth,
        floatAmount: item.floatAmount,
        floatDuration: item.floatDuration,
      };
    });

  const existingTitles = new Set(
    validItems.map((item) => item.title.toLowerCase()),
  );
  LOCAL_FLOATING_PROJECTS.forEach((item) => {
    if (!existingTitles.has(item.title.toLowerCase())) validItems.push(item);
  });
  const figureSettings = figure as
    | (typeof figure & { useUploadedFigureArtwork?: boolean | null })
    | undefined;
  const useUploadedFigureArtwork =
    stegaClean(figureSettings?.useUploadedFigureArtwork) === true;
  const resolvedPersonSrc = useUploadedFigureArtwork
    ? figure?.personImage?.asset?.url
    : GENERATED_BODY_SRC;
  const resolvedHandSrc = useUploadedFigureArtwork
    ? figure?.handImage?.asset?.url
    : GENERATED_HAND_SRC;
  const resolvedHandWidth = useUploadedFigureArtwork
    ? figure?.handWidth ?? 110
    : Math.max(148, figure?.handWidth ?? 0);
  const resolvedHandAspectRatio = useUploadedFigureArtwork ? 179 / 163 : 1;
  const resolvedHandTipX = useUploadedFigureArtwork
    ? figure?.handTipX ?? DEFAULT_HAND_POINTS.tipX
    : GENERATED_HAND_POINTS.tipX;
  const resolvedHandTipY = useUploadedFigureArtwork
    ? figure?.handTipY ?? DEFAULT_HAND_POINTS.tipY
    : GENERATED_HAND_POINTS.tipY;
  const resolvedHandWristX = useUploadedFigureArtwork
    ? figure?.handWristX ?? DEFAULT_HAND_POINTS.wristX
    : GENERATED_HAND_POINTS.wristX;
  const resolvedHandWristY = useUploadedFigureArtwork
    ? figure?.handWristY ?? DEFAULT_HAND_POINTS.wristY
    : GENERATED_HAND_POINTS.wristY;
  const resolvedPersonWidth = useUploadedFigureArtwork
    ? figure?.personWidth ?? 9
    : Math.max(8, figure?.personWidth ?? 0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const floatingLayers = gsap.utils.toArray<HTMLElement>(
      "[data-what-we-do-float]",
      root,
    );
    const revealLayers = gsap.utils.toArray<HTMLElement>(
      "[data-what-we-do-reveal]",
      root,
    );
    const scrollLagLayers = gsap.utils.toArray<HTMLElement>(
      "[data-what-we-do-scroll-lag]",
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
    const enableDesktopFloat = hasFinePointer && window.innerWidth >= 1024;
    const context = gsap.context(() => {
      gsap.set(floatingLayers, { rotation: 0, rotationX: 0, rotationY: 0 });
      gsap.set(revealLayers, {
        autoAlpha: 1,
        scale: reduceMotion ? 1 : enableDesktopFloat ? 0.12 : 0.68,
        transformOrigin: "50% 50%",
      });
      gsap.set(scrollLagLayers, { y: 0 });

      if (!reduceMotion) {
        if (enableDesktopFloat) scrollLagLayers.forEach((layer) => {
          const speed = Number(layer.dataset.scrollSpeed || 0.14);
          const rate = Number(layer.dataset.scrollRate);
          const lag = Number(layer.dataset.scrollLag || 0.9);
          const usesScrollRate = Number.isFinite(rate);
          const rateTravel = () =>
            (root.offsetHeight + window.innerHeight) * (1 - rate);

          gsap.fromTo(
            layer,
            {
              y: () =>
                usesScrollRate
                  ? rateTravel() * -0.5
                  : window.innerHeight * speed * 0.45,
            },
            {
              y: () =>
                usesScrollRate
                  ? rateTravel() * 0.5
                  : window.innerHeight * speed * -0.65,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top bottom",
                end: "bottom top",
                scrub: lag,
                invalidateOnRefresh: true,
              },
            },
          );
        });

        ScrollTrigger.create({
          trigger: root,
          start: enableDesktopFloat ? "top 72%" : "top 88%",
          once: true,
          onEnter: () => {
            gsap.to(revealLayers, {
              scale: 1,
              duration: enableDesktopFloat ? 0.44 : 0.22,
              delay: enableDesktopFloat ? 0.14 : 0,
              stagger: enableDesktopFloat ? 0.06 : 0.055,
              ease: enableDesktopFloat ? "back.out(1.9)" : "back.out(1.35)",
              overwrite: "auto",
            });
          },
        });

        if (enableDesktopFloat) floatingLayers.forEach((layer, index) => {
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
    let routeSign = 1;
    let smoothedRouteX = 0;
    let smoothedRouteY = 0;
    let routeVectorInitialized = false;
    let crossingBlend = 0;
    let presence = 0;
    let initialized = false;
    let rotationInitialized = false;
    let smoothedRotationRadians = 0;
    let lastUpdate = performance.now();
    const handWidth = resolvedHandWidth;
    const handHeight = handWidth * resolvedHandAspectRatio;
    const tipX = resolvedHandTipX / 100;
    const tipY = resolvedHandTipY / 100;
    const wristX = resolvedHandWristX / 100;
    const wristY = resolvedHandWristY / 100;
    const naturalFingerAngle = Math.atan2(
      (tipY - wristY) * handHeight,
      (tipX - wristX) * handWidth,
    );
    const rotationOffsetRadians =
      (((useUploadedFigureArtwork ? figure?.handRotationOffset : 0) ?? 0) *
        Math.PI) /
      180;
    const handContentBounds = useUploadedFigureArtwork
      ? { left: 0, right: 1, top: 0, bottom: 1 }
      : { left: 0.185, right: 0.895, top: 0.145, bottom: 0.9 };
    const handCorners = [
      {
        x: (handContentBounds.left - tipX) * handWidth,
        y: (handContentBounds.top - tipY) * handHeight,
      },
      {
        x: (handContentBounds.right - tipX) * handWidth,
        y: (handContentBounds.top - tipY) * handHeight,
      },
      {
        x: (handContentBounds.right - tipX) * handWidth,
        y: (handContentBounds.bottom - tipY) * handHeight,
      },
      {
        x: (handContentBounds.left - tipX) * handWidth,
        y: (handContentBounds.bottom - tipY) * handHeight,
      },
    ];
    const getHandBottomOffset = (rotationRadians: number) => {
      const sine = Math.sin(rotationRadians);
      const cosine = Math.cos(rotationRadians);
      return Math.max(
        0,
        ...handCorners.map((corner) => corner.x * sine + corner.y * cosine),
      );
    };

    const getArmOrigin = (bounds: DOMRect) => {
      if (!useUploadedFigureArtwork && bodySocketRef.current) {
        const socketBounds = bodySocketRef.current.getBoundingClientRect();
        return {
          x: socketBounds.left - bounds.left + socketBounds.width / 2,
          y: socketBounds.top - bounds.top + socketBounds.height / 2,
        };
      }

      return {
        x: bounds.width * ((figure?.shoulderX ?? 88) / 100),
        y: bounds.height * ((figure?.shoulderY ?? 76) / 100),
      };
    };

    const setRestTarget = () => {
      const bounds = root.getBoundingClientRect();
      const origin = getArmOrigin(bounds);
      const restReach = Math.max(
        resolvedHandWidth * 1.55,
        Math.min(bounds.width * 0.13, 230),
      );
      const groundInset = Math.max(7, Math.min(14, bounds.height * 0.012));
      pointer.x = Math.max(
        resolvedHandWidth * 0.25,
        Math.min(bounds.width - resolvedHandWidth * 0.25, origin.x - restReach),
      );
      let restingTipY = bounds.height - groundInset;
      // Recalculate a few times because raising the fingertip slightly also
      // changes the resting aim/rotation and therefore its bottom-most pixel.
      for (let index = 0; index < 3; index += 1) {
        const restingRotation =
          Math.atan2(restingTipY - origin.y, pointer.x - origin.x) -
          naturalFingerAngle +
          rotationOffsetRadians;
        restingTipY =
          bounds.height - groundInset - getHandBottomOffset(restingRotation);
      }
      pointer.y = restingTipY;
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

    const getProjectVisualBounds = (project: HTMLElement) =>
      (
        project.querySelector<HTMLElement>("[data-what-we-do-scroll-lag]") ??
        project
      ).getBoundingClientRect();

    const projectListeners = projectLinks.map((project) => {
      const onEnter = (event: Event) => {
        const rootBounds = root.getBoundingClientRect();
        const projectBounds = getProjectVisualBounds(project);
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

        const origin = getArmOrigin(rootBounds);
        const projectCenterX =
          projectBounds.left - rootBounds.left + projectBounds.width / 2;
        const projectCenterY =
          projectBounds.top - rootBounds.top + projectBounds.height / 2;
        const pointerDeltaX = pointer.x - origin.x;
        const pointerDeltaY = pointer.y - origin.y;
        const pointerDistance = Math.max(
          1,
          Math.hypot(pointerDeltaX, pointerDeltaY),
        );
        const pointerNormalX = -pointerDeltaY / pointerDistance;
        const pointerNormalY = pointerDeltaX / pointerDistance;
        const centerSide =
          pointerNormalX * (projectCenterX - origin.x) +
          pointerNormalY * (projectCenterY - origin.y);

        // Keep the route on the side selected at entry. Re-evaluating this
        // sign every frame causes a visible snap when the pointer crosses the
        // item's centerline.
        routeSign = centerSide >= 0 ? -1 : 1;
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
      const origin = getArmOrigin(bounds);
      const originX = origin.x;
      const originY = origin.y;
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
        const projectBounds = getProjectVisualBounds(hoveredProject);
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
      if (!pointerInside && !focusInside) {
        const safeRestingY =
          bounds.height - 6 - getHandBottomOffset(rotationRadians);
        current.y = Math.min(current.y, safeRestingY);
      }
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
        const routeAlpha = reduceMotion
          ? 1
          : 1 - Math.exp(-deltaSeconds * 5.5);
        const desiredRouteX = normalX * routeSign;
        const desiredRouteY = normalY * routeSign;
        if (!routeVectorInitialized || reduceMotion) {
          smoothedRouteX = desiredRouteX;
          smoothedRouteY = desiredRouteY;
          routeVectorInitialized = true;
        } else {
          smoothedRouteX +=
            (desiredRouteX - smoothedRouteX) * routeAlpha;
          smoothedRouteY +=
            (desiredRouteY - smoothedRouteY) * routeAlpha;
        }
        crossingBlend +=
          ((crossesProject ? 1 : 0) - crossingBlend) * routeAlpha;
        const routeX = smoothedRouteX;
        const routeY = smoothedRouteY;
        const crossingAvoidance = 1 + crossingBlend * 0.45;
        const firstRouteWeight = 0.48 + crossingBlend * 0.32;
        const secondRouteWeight = 0.32 + crossingBlend * 0.32;
        const avoidance = Math.min(
          285,
          (Math.max(hoveredBounds.width, hoveredBounds.height) * 0.72 +
            handWidth * 0.52) * crossingAvoidance,
        );

        controlOneX +=
          (routeX * avoidance * firstRouteWeight +
            outwardX * avoidance * 0.24) *
          avoidanceStrength;
        controlOneY +=
          (routeY * avoidance * firstRouteWeight +
            outwardY * avoidance * 0.24) *
          avoidanceStrength;
        const avoidedControlTwoX =
          armEndX +
          outwardX * avoidance * 1.12 +
          routeX * avoidance * secondRouteWeight;
        const avoidedControlTwoY =
          armEndY +
          outwardY * avoidance * 1.12 +
          routeY * avoidance * secondRouteWeight;
        controlTwoX +=
          (avoidedControlTwoX - controlTwoX) * avoidanceStrength;
        controlTwoY +=
          (avoidedControlTwoY - controlTwoY) * avoidanceStrength;
      } else {
        crossingBlend += (0 - crossingBlend) * stateAlpha;
      }

      const windAmount =
        (1 - presence) * Math.min(76, Math.max(42, handWidth * 0.62));
      controlOneX += normalX * windAmount;
      controlOneY += normalY * windAmount;
      controlTwoX -= normalX * windAmount * 0.78;
      controlTwoY -= normalY * windAmount * 0.78;

      const restingSag =
        (1 - presence) * Math.min(80, Math.max(36, distance * 0.28));
      controlOneY = Math.min(
        bounds.height - 8,
        controlOneY + restingSag * 0.35,
      );
      controlTwoY = Math.min(
        bounds.height - 8,
        controlTwoY + restingSag * 0.82,
      );

      const armWidth = useUploadedFigureArtwork
        ? figure?.armWidth ?? 34
        : 34;
      const shoulderHalfWidth = Math.max(8, armWidth * 0.3);
      const handHalfWidth = useUploadedFigureArtwork
        ? Math.max(10, armWidth * 0.52)
        : handWidth * 0.155;

      // The body opening always faces left. Give the centerline a small,
      // genuine-radius turn immediately outside that opening before handing
      // it to the free slink controls. This keeps it from doubling back over
      // the body mouth without creating a visible straight stem.
      const bodyExitAngle = Math.PI;
      const bodyExitX = Math.cos(bodyExitAngle);
      const bodyExitY = Math.sin(bodyExitAngle);
      const minimumBodyClearance = Math.max(24, armWidth * 0.72);
      const controlOneProjection =
        (controlOneX - originX) * bodyExitX +
        (controlOneY - originY) * bodyExitY;
      if (controlOneProjection < minimumBodyClearance) {
        const correction = minimumBodyClearance - controlOneProjection;
        controlOneX += bodyExitX * correction;
        controlOneY += bodyExitY * correction;
      }

      const requestedBodyRouteAngle = Math.atan2(
        controlOneY - originY,
        controlOneX - originX,
      );
      const requestedBodyTurn = Math.atan2(
        Math.sin(requestedBodyRouteAngle - bodyExitAngle),
        Math.cos(requestedBodyRouteAngle - bodyExitAngle),
      );
      const maximumBodyTurn = Math.PI * 0.42;
      const bodyTurn = Math.max(
        -maximumBodyTurn,
        Math.min(maximumBodyTurn, requestedBodyTurn),
      );
      const bodyArcRadius = Math.max(18, Math.min(28, armWidth * 0.68));
      const bodyArcPoints: ArmPoint[] = [];
      let bodyArcEndX = originX;
      let bodyArcEndY = originY;
      let bodyArcEndAngle = bodyExitAngle;
      const bodyArcSamples = 5;

      if (Math.abs(bodyTurn) < 0.08) {
        const straightLength = bodyArcRadius * 0.8;
        for (let index = 1; index <= bodyArcSamples; index += 1) {
          const progress = index / bodyArcSamples;
          bodyArcEndX = originX + bodyExitX * straightLength * progress;
          bodyArcEndY = originY + bodyExitY * straightLength * progress;
          bodyArcPoints.push({
            x: bodyArcEndX,
            y: bodyArcEndY,
            halfWidth: shoulderHalfWidth,
          });
        }
      } else {
        const turnSign = Math.sign(bodyTurn);
        const leftNormalX = -Math.sin(bodyExitAngle);
        const leftNormalY = Math.cos(bodyExitAngle);
        const circleCenterX =
          originX + leftNormalX * bodyArcRadius * turnSign;
        const circleCenterY =
          originY + leftNormalY * bodyArcRadius * turnSign;
        const startRadiusX = originX - circleCenterX;
        const startRadiusY = originY - circleCenterY;

        for (let index = 1; index <= bodyArcSamples; index += 1) {
          const progress = index / bodyArcSamples;
          const angle = bodyTurn * progress;
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);
          bodyArcEndX =
            circleCenterX + startRadiusX * cosine - startRadiusY * sine;
          bodyArcEndY =
            circleCenterY + startRadiusX * sine + startRadiusY * cosine;
          bodyArcPoints.push({
            x: bodyArcEndX,
            y: bodyArcEndY,
            halfWidth: shoulderHalfWidth,
          });
        }
        bodyArcEndAngle = bodyExitAngle + bodyTurn;
      }

      const tangentLength = Math.min(12, Math.max(5, distance * 0.016));
      const bodyTangent = {
        x: bodyArcEndX + Math.cos(bodyArcEndAngle) * tangentLength,
        y: bodyArcEndY + Math.sin(bodyArcEndAngle) * tangentLength,
      };
      const localCuffOutwardAngle = useUploadedFigureArtwork
        ? naturalFingerAngle + Math.PI
        : GENERATED_HAND_CUFF_OUTWARD_ANGLE;
      const cuffOutwardAngle = rotationRadians + localCuffOutwardAngle;
      const cuffOutwardX = Math.cos(cuffOutwardAngle);
      const cuffOutwardY = Math.sin(cuffOutwardAngle);
      const handTangent = {
        x: armEndX + cuffOutwardX * tangentLength,
        y: armEndY + cuffOutwardY * tangentLength,
      };
      const elasticMidpoint = {
        x: (controlOneX + controlTwoX) / 2,
        y: (controlOneY + controlTwoY) / 2,
      };
      const middleHalfWidth =
        shoulderHalfWidth + (handHalfWidth - shoulderHalfWidth) * 0.5;
      const armPoints: ArmPoint[] = [
        {
          x: originX,
          y: originY,
          halfWidth: shoulderHalfWidth,
          normalX: -bodyExitY,
          normalY: bodyExitX,
        },
        ...bodyArcPoints,
      ];
      const samplesPerHalf = 12;

      for (let index = 1; index <= samplesPerHalf; index += 1) {
        const sampleProgress = index / samplesPerHalf;
        const point = cubicPoint(
          { x: bodyArcEndX, y: bodyArcEndY },
          bodyTangent,
          { x: controlOneX, y: controlOneY },
          elasticMidpoint,
          sampleProgress,
        );
        armPoints.push({
          ...point,
          halfWidth:
            shoulderHalfWidth +
            (middleHalfWidth - shoulderHalfWidth) * sampleProgress,
        });
      }

      for (let index = 1; index <= samplesPerHalf; index += 1) {
        const sampleProgress = index / samplesPerHalf;
        const point = cubicPoint(
          elasticMidpoint,
          { x: controlTwoX, y: controlTwoY },
          handTangent,
          { x: armEndX, y: armEndY },
          sampleProgress,
        );
        armPoints.push({
          ...point,
          halfWidth:
            middleHalfWidth +
            (handHalfWidth - middleHalfWidth) * sampleProgress,
          ...(index === samplesPerHalf
            ? {
                normalX: cuffOutwardY,
                normalY: -cuffOutwardX,
              }
            : undefined),
        });
      }

      armPath.setAttribute("d", buildArmOutline(armPoints));

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
  }, [
    figure,
    resolvedHandAspectRatio,
    resolvedHandTipX,
    resolvedHandTipY,
    resolvedHandWidth,
    resolvedHandWristX,
    resolvedHandWristY,
    useUploadedFigureArtwork,
    validItems.length,
  ]);

  return (
    <section
      ref={rootRef}
      id={cleanAnchor || "work"}
      data-typeon-trigger="true"
      className={cn(
        "relative isolate z-[3] h-auto min-h-[82rem] overflow-visible sm:min-h-[72rem] lg:h-[100svh] lg:min-h-[100svh]",
        getSectionSurfaceClass(cleanColor),
        padding?.top ? "pt-16 xl:pt-20" : undefined,
        padding?.bottom ? "pb-16 xl:pb-20" : undefined,
      )}
    >
      <BackgroundPanel background={background} className="!border-0" />

      <div className="relative mx-auto min-h-[82rem] max-w-[1800px] sm:min-h-[72rem] lg:h-full lg:min-h-0">
        {heading && (
          <div
            className="pointer-events-none absolute inset-x-0 top-[22%] z-20 flex justify-center md:top-[28%]"
          >
            <div
              data-what-we-do-scroll-lag
              data-scroll-rate="0.8"
              data-scroll-lag="2.4"
              className="lg:will-change-transform"
            >
              <h2 className="whitespace-nowrap text-center text-base font-bold uppercase md:text-xl">
                <TypeOnText
                  text={stegaClean(heading)}
                  trigger="scroll"
                  start="top 78%"
                  speed={TYPE_ON_SPEEDS.quick}
                />
              </h2>
            </div>
          </div>
        )}

        <div className="absolute inset-0 z-20">
          {validItems.map((item, index) => {
            const fallback = DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length];
            const tablet = TABLET_POSITIONS[index % TABLET_POSITIONS.length];
            const mobile = MOBILE_POSITIONS[index % MOBILE_POSITIONS.length];
            const style: ItemStyle = {
              "--item-x": `${item.positionX ?? fallback.x}%`,
              "--item-y": `${item.positionY ?? fallback.y}%`,
              "--item-width": `${item.width ?? fallback.width}%`,
              "--item-mobile-x": `${mobile.x}%`,
              "--item-mobile-y": `${mobile.y}%`,
              "--item-mobile-width": `${mobile.width}%`,
              "--item-tablet-x": `${tablet.x}%`,
              "--item-tablet-y": `${tablet.y}%`,
              "--item-tablet-width": `${tablet.width}%`,
              zIndex: 20 + index,
            };
            const title = item.title;
            const href = item.href;
            const isRevealActive = activeRevealKey === item._key;
            const scrollSpeed = 0.15 + (index % 5) * 0.04;
            const scrollLag = 0.85 + (index % 4) * 0.34;
            const projectContent = (
              <div
                data-what-we-do-scroll-lag
                data-scroll-speed={scrollSpeed}
                data-scroll-lag={scrollLag}
                className="relative lg:will-change-transform"
              >
                <div data-what-we-do-reveal className="relative will-change-transform">
                  <div
                    data-what-we-do-float
                    data-float-amount={item.floatAmount ?? 12}
                    data-float-duration={item.floatDuration ?? 5}
                    className="relative lg:will-change-transform"
                  >
                    <div
                      className={cn(
                        "relative w-full overflow-hidden border-2 border-transparent transition-[transform,border-color] duration-300 ease-out group-hover:scale-105 group-focus-visible:scale-105",
                        item.interactionMode === "reveal" && isRevealActive
                          ? "border-[#ff00d9]"
                          : undefined,
                        item.aspectRatio === "portrait"
                          ? "aspect-[9/16]"
                          : "aspect-[4/3]",
                      )}
                    >
                      <ProjectMedia item={item} />
                    </div>
                    {item.interactionMode === "reveal" && isRevealActive ? (
                      <div className="pointer-events-none relative z-10 -mt-[2px] flex max-w-[19rem] flex-col items-start text-left text-white">
                        <p className="inline-flex max-w-full bg-[#ff00d9] px-3 py-1 text-base font-semibold uppercase leading-none tracking-[-.035em]">
                          {item.revealTitle || title}
                        </p>
                        {item.revealDescription && (
                          <p className="mt-0.5 w-full bg-[#ff00d9] px-3 py-2 text-sm leading-[1.08]">
                            <TypeOnText
                              text={item.revealDescription}
                              trigger="immediate"
                              speed={2.4}
                            />
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="pointer-events-none absolute left-1/2 top-full mt-2 w-max min-w-max -translate-x-1/2 whitespace-nowrap text-sm font-bold uppercase md:text-base">
                        {touchLayout ? (
                          title
                        ) : (
                          <TypeOnText
                            text={title}
                            trigger="hover"
                            speed={1.35}
                            className="!whitespace-nowrap"
                          />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
            const projectClassName =
              "group absolute left-[var(--item-mobile-x)] top-[var(--item-mobile-y)] w-[var(--item-mobile-width)] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-inherit focus-visible:outline-none md:left-[var(--item-tablet-x)] md:top-[var(--item-tablet-y)] md:w-[var(--item-tablet-width)] lg:left-[var(--item-x)] lg:top-[var(--item-y)] lg:w-[var(--item-width)]";

            if (item.interactionMode === "link" && href) {
              return (
              <Link
                key={item._key}
                href={href}
                target={item.target ? "_blank" : undefined}
                rel={item.target ? "noopener noreferrer" : undefined}
                data-what-we-do-project
                data-typeon-hover={touchLayout ? undefined : "true"}
                className={projectClassName}
                style={style}
                aria-label={`View ${title}`}
              >
                {projectContent}
              </Link>
              );
            }

            if (item.interactionMode === "reveal") {
              return (
                <button
                  type="button"
                  key={item._key}
                  data-what-we-do-project
                  data-typeon-hover={touchLayout ? undefined : "true"}
                  className={projectClassName}
                  style={style}
                  aria-expanded={isRevealActive}
                  aria-label={`${isRevealActive ? "Hide" : "Show"} ${title} information`}
                  onClick={() =>
                    setActiveRevealKey((current) =>
                      current === item._key ? null : item._key,
                    )
                  }
                >
                  {projectContent}
                </button>
              );
            }

            if (item.interactionMode === "fullscreen") {
              return (
                <button
                  type="button"
                  key={item._key}
                  data-what-we-do-project
                  data-typeon-hover={touchLayout ? undefined : "true"}
                  className={projectClassName}
                  style={style}
                  aria-label={`Open ${title} fullscreen`}
                  onClick={() =>
                    setViewerContent({
                      title,
                      mediaType: item.expandedMediaType || item.mediaType,
                      imageUrl: item.expandedImageUrl || item.imageUrl,
                      imageAlt: item.expandedImageAlt || item.imageAlt,
                      videoUrl: item.expandedVideoUrl || item.videoUrl,
                      videoPosterUrl:
                        item.expandedVideoPosterUrl || item.videoPosterUrl,
                    })
                  }
                >
                  {projectContent}
                </button>
              );
            }

            return (
              <div
                key={item._key}
                data-what-we-do-project
                data-typeon-hover={touchLayout ? undefined : "true"}
                className={projectClassName}
                style={style}
              >
                {projectContent}
              </div>
            );
          })}

          {showSizzleReel && (
            <div
              data-what-we-do-project
              className="group absolute left-[72%] top-[84%] z-40 w-[25%] -translate-x-1/2 -translate-y-1/2 md:left-[41%] md:top-[86%] md:w-[15%] lg:left-[35%] lg:top-[79%] lg:w-[13%]"
            >
              <div
                data-what-we-do-scroll-lag
                data-scroll-speed="0.24"
                data-scroll-lag="1.55"
                className="relative lg:will-change-transform"
              >
                <div data-what-we-do-reveal className="relative will-change-transform">
                  <div
                    data-what-we-do-float
                    data-float-amount="6"
                    data-float-duration="5.2"
                    className="relative lg:will-change-transform"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setViewerContent({
                          title: sizzleLabel,
                          mediaType: "video",
                          videoUrl: sizzleVideoUrl,
                          videoPosterUrl: sizzleVideoPosterUrl,
                        })
                      }
                      className="relative flex aspect-[2.1/1] w-full items-center justify-center overflow-hidden bg-transparent px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                      aria-label={`Open ${sizzleLabel} fullscreen`}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 scale-110 bg-center transition-transform duration-300 group-hover:scale-125"
                        style={{
                          backgroundImage: touchLayout
                            ? "url(/images/what-we-do/sizzle-fire-poster.png)"
                            : `url(${sizzleFireSrc})`,
                          backgroundPosition: "center bottom",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "contain",
                        }}
                      />
                      <span className="relative z-10 whitespace-pre-line text-center text-[clamp(1.2rem,2.25vw,2.8rem)] font-bold italic uppercase leading-[0.7] tracking-[-0.07em] text-white [-webkit-text-stroke:2px_#e32119] [paint-order:stroke_fill]">
                        {sizzleLabel.replace(/\s+/, "\n")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 hidden h-full w-full overflow-visible md:block"
        >
          <path ref={armPathRef} fill={ARM_FILL} />
        </svg>

        <div
          ref={handRef}
          data-what-we-do-hand
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-50 hidden origin-center will-change-transform md:block"
          style={{ width: `${resolvedHandWidth}px` }}
        >
          {resolvedHandSrc ? (
            <Image
              src={resolvedHandSrc}
              alt=""
              width={1254}
              height={Math.round(1254 * resolvedHandAspectRatio)}
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
              left: `${resolvedHandTipX}%`,
              top: `${resolvedHandTipY}%`,
            }}
          />
          <span
            data-what-we-do-wrist
            className="pointer-events-none absolute h-px w-px opacity-0"
            style={{
              left: `${resolvedHandWristX}%`,
              top: `${resolvedHandWristY}%`,
            }}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 z-40 hidden -translate-x-1/2 md:block"
          style={{
            left: `${figure?.personX ?? 88}%`,
            width: `${resolvedPersonWidth}%`,
          }}
        >
          {resolvedPersonSrc ? (
            <Image
              src={resolvedPersonSrc}
              alt=""
              width={1023}
              height={1537}
              className="h-auto w-full object-contain"
            />
          ) : (
            <span className="block origin-bottom-left -scale-x-100 text-[clamp(4rem,8vw,8rem)] leading-none grayscale">
              🧎
            </span>
          )}
          {!useUploadedFigureArtwork && (
            <span
              ref={bodySocketRef}
              data-what-we-do-body-socket
              className="pointer-events-none absolute h-px w-px opacity-0"
              style={{
                left: `${GENERATED_BODY_SOCKET.x}%`,
                top: `${GENERATED_BODY_SOCKET.y}%`,
              }}
            />
          )}
        </div>
      </div>
      <WorkContentViewer content={viewerContent} onClose={closeViewer} />
    </section>
  );
}
