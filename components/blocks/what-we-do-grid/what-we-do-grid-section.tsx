"use client";

import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { PAGE_QUERYResult } from "@/sanity.types";
import TypeOnText from "@/components/ui/type-on-text";
import { urlFor } from "@/sanity/lib/image";
import TitleText from "@/components/ui/title-text";
import {
  SECTION_HEADER_BODY_TYPE_CLASS,
  TEXT_STYLES,
} from "@/components/ui/text-styles";
import { splitTextAtWordRatio } from "@/components/blocks/shared/text-lines";
import FlyingPigeonScene from "@/components/blocks/what-we-do-grid/flying-pigeon-scene";
import PizzaRatScene from "@/components/blocks/what-we-do-grid/pizza-rat-scene";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
export type WhatWeDoGridBlock = Extract<
  PageBlock,
  { _type: "what-we-do-grid-section" }
>;

const safeNumber = (value: number | null | undefined, fallback: number) => {
  const clean = stegaClean(value);
  return typeof clean === "number" && Number.isFinite(clean) ? clean : fallback;
};

function splitTextIntoBalancedLines(value: string, lineCount: number) {
  const words = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (lineCount <= 1 || words.length <= 1) return [words.join(" ")];

  const lines: string[] = [];
  let cursor = 0;
  while (cursor < words.length && lines.length < lineCount - 1) {
    const linesLeft = lineCount - lines.length;
    const remaining = words.slice(cursor);
    const targetLength =
      (remaining.reduce((total, word) => total + word.length, 0) +
        Math.max(0, remaining.length - 1)) /
      linesLeft;
    let bestEnd = cursor + 1;
    let bestDistance = Number.POSITIVE_INFINITY;
    let currentLength = 0;

    for (
      let index = cursor;
      index <= words.length - (linesLeft - 1);
      index += 1
    ) {
      currentLength += words[index].length + (index > cursor ? 1 : 0);
      const distance = Math.abs(currentLength - targetLength);
      if (distance <= bestDistance) {
        bestDistance = distance;
        bestEnd = index + 1;
      } else if (currentLength > targetLength) {
        break;
      }
    }

    lines.push(words.slice(cursor, bestEnd).join(" "));
    cursor = bestEnd;
  }
  lines.push(words.slice(cursor).join(" "));
  return lines;
}

function colorValue(
  color: { hex?: string | null } | null | undefined,
  fallback: string,
) {
  return stegaClean(color?.hex) || fallback;
}

const CITY_BUILDINGS = [
  { x: 0, width: 92, height: 196 },
  { x: 74, width: 108, height: 242 },
  { x: 166, width: 84, height: 172 },
  { x: 232, width: 126, height: 278 },
  { x: 342, width: 88, height: 218 },
  { x: 414, width: 146, height: 332 },
  { x: 542, width: 104, height: 258 },
  { x: 630, width: 98, height: 204 },
  { x: 712, width: 176, height: 382 },
  { x: 872, width: 112, height: 264 },
  { x: 968, width: 144, height: 318 },
  { x: 1096, width: 92, height: 228 },
  { x: 1170, width: 152, height: 286 },
  { x: 1306, width: 112, height: 212 },
  { x: 1400, width: 134, height: 254 },
  { x: 1518, width: 96, height: 184 },
] as const;

const REFERENCE_SCENE_OBJECTS = [
  {
    src: "/images/what-we-do/cloud.png",
    alt: "",
    className:
      "right-[4%] top-[-4%] w-[clamp(16rem,31vw,29rem)] opacity-95",
    depth: 0.11,
    endScale: 1.035,
    zIndex: 11,
    width: 428,
    height: 278,
  },
  {
    src: "/images/what-we-do/trash-pile.png",
    alt: "",
    className:
      "bottom-[4%] right-[-24%] w-[clamp(16rem,28vw,28rem)] sm:right-[-18%] lg:right-[-16%] lg:!z-[55]",
    depth: 0.72,
    endScale: 1.15,
    zIndex: 23,
    width: 362,
    height: 362,
  },
] as const;

function ProceduralCity({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 1600 520"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-4 bottom-[39%] h-[44%] md:inset-x-8"
      aria-hidden="true"
    >
      <g fill={color} fillOpacity=".66" stroke="#171b19" strokeOpacity=".28" strokeWidth="2">
        {CITY_BUILDINGS.map((building, index) => {
          const y = 500 - building.height;
          return (
            <g key={`${building.x}-${building.height}`}>
              <rect x={building.x} y={y} width={building.width} height={building.height} />
              {index % 3 === 1 && (
                <path
                  d={`M${building.x + building.width * 0.18} ${y} L${building.x + building.width / 2} ${y - 28} L${building.x + building.width * 0.82} ${y} Z`}
                />
              )}
              {Array.from({ length: Math.max(2, Math.floor(building.width / 28)) }, (_, column) => (
                <line
                  key={`v-${column}`}
                  x1={building.x + 14 + column * 24}
                  x2={building.x + 14 + column * 24}
                  y1={y + 18}
                  y2="496"
                  stroke="#eef1ee"
                  strokeOpacity=".24"
                  strokeWidth="5"
                  strokeDasharray="8 13"
                />
              ))}
            </g>
          );
        })}
        <path d="M785 118h34v-52h18v52h34v382h-86z" fillOpacity=".84" />
        <path d="M803 66h50l-25-42z" fillOpacity=".78" />
        <path d="M826 24h4V0h-4z" fillOpacity=".9" />
      </g>
      <path d="M0 500h1600" stroke="#171b19" strokeWidth="8" opacity=".55" />
    </svg>
  );
}

function ProceduralGround({ from, to }: { from: string; to: string }) {
  return (
    <div className="absolute inset-x-4 top-[61%] h-[36%] md:inset-x-8">
      <div className="absolute inset-x-0 top-0 h-[14%] border-y border-black/40 bg-[#d8ddda] shadow-[0_7px_0_rgba(255,255,255,.72)]" />
      <div
        className="absolute inset-x-0 bottom-0 top-[14%]"
        style={{
          backgroundColor: to,
          backgroundImage: `radial-gradient(circle at 20% 35%, rgba(255,255,255,.14) 0 1px, transparent 1.5px), radial-gradient(circle at 75% 70%, rgba(0,0,0,.24) 0 1px, transparent 1.5px), linear-gradient(180deg, ${from}, ${to})`,
          backgroundSize: "13px 13px, 17px 17px, 100% 100%",
        }}
      />
      <div className="absolute inset-x-0 top-[51%] h-[4px] bg-white/75 shadow-[0_1px_0_rgba(0,0,0,.3)]" />
    </div>
  );
}

function LayeredBackground({ block }: { block: WhatWeDoGridBlock }) {
  const layers = block.layers || [];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {!layers.length && (
        <>
          <div
            data-what-layer
            data-depth="0.08"
            data-end-scale="1.025"
            className="absolute inset-[-8%] origin-center bg-[radial-gradient(circle_at_75%_8%,rgba(255,255,255,.92),transparent_27%),linear-gradient(180deg,#eff0ed_0%,#d5d9d5_63%,#afb4ae_100%)] will-change-transform"
          />
          <div
            data-what-layer
            data-depth="0.32"
            data-end-scale="1.09"
            className="absolute inset-x-[-8%] bottom-[24%] h-[46%] origin-bottom bg-[repeating-linear-gradient(90deg,rgba(31,38,34,.26)_0_2.8vw,transparent_2.8vw_4vw),linear-gradient(180deg,transparent,rgba(25,30,27,.34))] [clip-path:polygon(0_32%,8%_20%,8%_100%,14%_100%,14%_8%,20%_8%,20%_100%,27%_100%,27%_25%,34%_25%,34%_100%,41%_100%,41%_0,49%_0,49%_100%,57%_100%,57%_18%,66%_18%,66%_100%,73%_100%,73%_29%,81%_29%,81%_100%,89%_100%,89%_12%,96%_12%,96%_100%,100%_100%)] will-change-transform"
          />
          <div
            data-what-layer
            data-depth="0.72"
            data-end-scale="1.16"
            className="absolute inset-x-[-8%] bottom-[-10%] h-[47%] origin-bottom bg-[linear-gradient(180deg,#858c88_0%,#565c58_10%,#343936_100%)] after:absolute after:inset-x-0 after:top-[19%] after:h-[3px] after:bg-white/70 will-change-transform"
          />
        </>
      )}

      {layers.map((layer, index) => {
        const kind = stegaClean(layer.layerType) || "image";
        const depth = safeNumber(layer.depth, 0.35);
        const startScale = safeNumber(layer.startScale, 1);
        const endScale = safeNumber(layer.endScale, 1 + depth * 0.18);
        const x = safeNumber(layer.xOffset, 0);
        const y = safeNumber(layer.yOffset, 0);
        const opacity = safeNumber(layer.opacity, 1);
        const blendMode = (stegaClean(layer.blendMode) || "normal") as CSSProperties["mixBlendMode"];
        const style: CSSProperties = {
          zIndex: index,
          opacity: kind === "ground" ? 1 : opacity,
          mixBlendMode: kind === "ground" ? "normal" : blendMode,
          transform: `translate3d(${x}%, ${y}%, 0) scale(${startScale})`,
        };

        if (kind === "color") {
          style.backgroundColor = colorValue(layer.color, "transparent");
        } else if (kind === "gradient") {
          style.backgroundImage = `linear-gradient(${safeNumber(layer.angle, 180)}deg, ${colorValue(layer.fromColor, "transparent")}, ${colorValue(layer.toColor, "rgba(0,0,0,.2)")})`;
        }

        return (
          <div
            key={layer._key}
            data-what-layer
            data-depth={depth}
            data-end-scale={endScale}
            className="absolute inset-0 origin-center will-change-transform"
            style={style}
          >
            {kind === "checker" && (
              <div
                className="absolute inset-x-4 bottom-[39%] top-4 md:inset-x-8 md:top-8"
                style={{
                  backgroundColor: colorValue(layer.fromColor, "#ffffff"),
                  backgroundImage: `conic-gradient(${colorValue(layer.color, "#e6e6e6")} 25%, transparent 0 50%, ${colorValue(layer.color, "#e6e6e6")} 0 75%, transparent 0)`,
                  backgroundPosition: "0 0",
                  backgroundSize: "32px 32px",
                }}
              />
            )}
            {kind === "city" && (
              layer.image?.asset?.url ? (
                <div className="absolute inset-x-4 bottom-[39%] top-4 overflow-hidden md:inset-x-8 md:top-8">
                  <div className="absolute bottom-0 left-1/2 w-[92%] -translate-x-1/2 sm:w-[78%] lg:w-1/2">
                    <Image
                      src={layer.image.asset.url}
                      alt={stegaClean(layer.image.alt) || ""}
                      width={layer.image.asset.metadata?.dimensions?.width || 1316}
                      height={layer.image.asset.metadata?.dimensions?.height || 710}
                      sizes="120vw"
                      className="h-auto w-full object-contain object-bottom"
                      style={{ objectPosition: stegaClean(layer.objectPosition) || "50% 100%" }}
                    />
                  </div>
                </div>
              ) : (
                <ProceduralCity color={colorValue(layer.color, "#777d79")} />
              )
            )}
            {kind === "ground" && (
              layer.image?.asset?.url ? (
                <div
                  className="absolute inset-x-4 top-[61%] h-[36%] border-y border-black/45 bg-[#565b58] bg-cover bg-center bg-no-repeat md:inset-x-8"
                  style={{
                    backgroundImage: `url(${urlFor(layer.image).width(1800).quality(86).format("webp").url()})`,
                    backgroundPosition: stegaClean(layer.objectPosition) || "50% 50%",
                  }}
                />
              ) : (
                <ProceduralGround
                  from={colorValue(layer.fromColor, "#6f7773")}
                  to={colorValue(layer.toColor, "#303532")}
                />
              )
            )}
            {kind === "image" && layer.image?.asset?.url && (
              <div className="absolute inset-x-4 bottom-[3%] top-4 md:inset-x-8 md:top-8">
                <Image
                  src={layer.image.asset.url}
                  alt={stegaClean(layer.image.alt) || ""}
                  fill
                  sizes="120vw"
                  priority={index === 0}
                  className="object-cover"
                  style={{ objectPosition: stegaClean(layer.objectPosition) || "50% 50%" }}
                />
              </div>
            )}
          </div>
        );
      })}

      {REFERENCE_SCENE_OBJECTS.map((object) => (
        <div
          key={object.src}
          data-what-layer
          data-depth={object.depth}
          data-end-scale={object.endScale}
          className={`absolute origin-center will-change-transform ${object.className}`}
          style={{ zIndex: object.zIndex }}
        >
          <Image
            src={object.src}
            alt={object.alt}
            width={object.width}
            height={object.height}
            sizes="(min-width: 1024px) 25vw, 35vw"
            className="h-auto w-full object-contain"
          />
        </div>
      ))}

      <div className="absolute inset-x-4 bottom-[39%] top-4 z-20 bg-[linear-gradient(180deg,rgba(255,255,255,.12),transparent_58%)] md:inset-x-8 md:top-8" />
    </div>
  );
}

function ServiceCard({
  service,
  accent,
  touchActive = false,
  desktopFill = false,
  onTouchActivate,
}: {
  service: NonNullable<WhatWeDoGridBlock["services"]>[number];
  accent: string;
  touchActive?: boolean;
  desktopFill?: boolean;
  onTouchActivate?: () => void;
}) {
  const detectorRef = useRef<HTMLDivElement | null>(null);
  const coordinatesRef = useRef<HTMLDivElement | null>(null);
  const [pantsActive, setPantsActive] = useState(false);
  const href = stegaClean(service.link?.href) || "";
  const imageScale = safeNumber(service.imageScale, 1);
  const verticalOffset = safeNumber(service.verticalOffset, 0);
  const objectDetectHover = Boolean(stegaClean(service.objectDetectHover));
  const textColor = colorValue(service.accentTextColor, "#ffffff");
  const cleanServiceDescription = (stegaClean(service.description) || "")
    .replace(/\s+/g, " ")
    .trim();
  const cardActive = pantsActive || touchActive;
  const imageFrame = (() => {
    const width = service.image?.asset?.metadata?.dimensions?.width;
    const height = service.image?.asset?.metadata?.dimensions?.height;
    if (!width || !height) {
      return {
        width: 190,
        height: 300,
        sourceWidth: 240,
        aspectRatio: 190 / 300,
      };
    }
    const sourceWidth = (300 * width) / height;
    return {
      width: Math.max(110, Math.min(280, sourceWidth)),
      height: 300,
      sourceWidth,
      aspectRatio: width / height,
    };
  })();
  const mobileFrameWidth = `clamp(${15 * 16 * imageFrame.aspectRatio}px, ${34 * imageFrame.aspectRatio}svh, ${19 * 16 * imageFrame.aspectRatio}px)`;
  const tabletFrameWidth = `clamp(${17 * 16 * imageFrame.aspectRatio}px, ${32 * imageFrame.aspectRatio}svh, ${21 * 16 * imageFrame.aspectRatio}px)`;

  const updateDetector = (event: ReactPointerEvent<HTMLElement>) => {
    if (!objectDetectHover || !detectorRef.current) return;
    const rect = detectorRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100));
    detectorRef.current.style.setProperty("--detect-x", `${x}%`);
    detectorRef.current.style.setProperty("--detect-y", `${y}%`);
    if (coordinatesRef.current) {
      coordinatesRef.current.textContent = `x ${x.toFixed(5)}\ny ${y.toFixed(5)}`;
      coordinatesRef.current.style.transform = `translate(${x > 70 ? "-110%" : "10px"}, ${y < 20 ? "5px" : "-30px"})`;
    }
  };

  const content = (
    <article
      data-what-service
      onClickCapture={(event) => {
        if (
          window.matchMedia("(max-width: 1023px)").matches &&
          !touchActive
        ) {
          event.preventDefault();
          event.stopPropagation();
          onTouchActivate?.();
        }
      }}
      className={`relative flex h-full min-w-0 flex-col items-start justify-start text-left will-change-transform ${cardActive ? "z-[60]" : "z-40"}`}
      style={{
        "--service-image-width": `${imageFrame.width}px`,
        "--service-mobile-width": mobileFrameWidth,
        "--service-tablet-width": tabletFrameWidth,
      } as CSSProperties}
    >
      <div
        ref={detectorRef}
        data-what-service-image
        data-typeon-hover="true"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" || event.pointerType === "pen") {
            setPantsActive(true);
          }
        }}
        onPointerLeave={() => {
          setPantsActive(false);
        }}
        onPointerCancel={() => {
          setPantsActive(false);
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "mouse" || event.pointerType === "pen") {
            updateDetector(event);
          }
        }}
        className="relative mx-0 h-[clamp(15rem,34svh,19rem)] w-[min(72vw,var(--service-mobile-width))] origin-bottom overflow-hidden sm:h-[clamp(17rem,32svh,21rem)] sm:w-[min(39vw,var(--service-tablet-width))] lg:h-[var(--service-image-height)] lg:w-[var(--service-image-width)] lg:max-w-none"
        style={{
          "--service-image-width": `${imageFrame.width}px`,
          "--service-image-height": `${imageFrame.height}px`,
          "--service-mobile-width": mobileFrameWidth,
          "--service-tablet-width": tabletFrameWidth,
          aspectRatio: String(imageFrame.aspectRatio),
          transform: `translateY(${verticalOffset}%) scale(${imageScale})`,
        } as CSSProperties}
      >
        {service.image?.asset?.url ? (
          <div
            className="absolute bottom-0 left-1/2 h-full w-full -translate-x-1/2"
            style={{ "--service-source-width": `${imageFrame.sourceWidth}px` } as CSSProperties}
          >
            <Image
              src={service.image.asset.url}
              alt={stegaClean(service.image.alt) || stegaClean(service.title) || ""}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={`object-contain object-bottom ${
                desktopFill ? "object-cover object-center" : ""
              }`}
            />
          </div>
        ) : (
          <div className="absolute inset-x-[22%] bottom-0 top-[12%] border border-black/30 bg-black/10" />
        )}

        {objectDetectHover && service.hoverImage?.asset?.url && (
          <div className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-200 ${cardActive ? "opacity-100" : "opacity-0"}`}>
            <div
              className="absolute bottom-0 left-1/2 h-full w-full -translate-x-1/2"
              style={{ "--service-source-width": `${imageFrame.sourceWidth}px` } as CSSProperties}
            >
              <Image
                src={service.hoverImage.asset.url}
                alt={stegaClean(service.hoverImage.alt) || stegaClean(service.title) || ""}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className={`object-contain object-bottom ${
                  desktopFill ? "object-cover object-center" : ""
                }`}
              />
              <div className="absolute inset-0 bg-[var(--service-accent)] opacity-30 mix-blend-soft-light" style={{ "--service-accent": accent } as CSSProperties} />
            </div>
          </div>
        )}

        {objectDetectHover && (
          <div className={`pointer-events-none absolute inset-0 z-20 hidden transition-opacity duration-150 lg:block ${cardActive ? "opacity-100" : "opacity-0"}`}>
            <div
              className="absolute inset-y-0 w-px bg-[var(--service-accent)] shadow-[0_0_8px_var(--service-accent),0_0_18px_var(--service-accent)]"
              style={{ left: "var(--detect-x, 50%)", "--service-accent": accent } as CSSProperties}
            />
            <div
              className="absolute inset-x-0 h-px bg-[var(--service-accent)] shadow-[0_0_8px_var(--service-accent),0_0_18px_var(--service-accent)]"
              style={{ top: "var(--detect-y, 50%)", "--service-accent": accent } as CSSProperties}
            />
            <div
              className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--service-accent)] shadow-[0_0_10px_var(--service-accent),0_0_24px_var(--service-accent)]"
              style={{ left: "var(--detect-x, 50%)", top: "var(--detect-y, 50%)", "--service-accent": accent } as CSSProperties}
            />
            <div
              ref={coordinatesRef}
              className="absolute whitespace-pre font-mono text-[10px] leading-tight text-[var(--service-accent)]"
              style={{ left: "var(--detect-x, 50%)", top: "var(--detect-y, 50%)", "--service-accent": accent } as CSSProperties}
            >
              x 50.00000{"\n"}y 50.00000
            </div>
          </div>
        )}

        <div
          className={cardActive
            ? "pointer-events-none absolute inset-0 z-30 border-[3px] shadow-[0_0_0_1px_rgba(255,255,255,.72),0_0_18px_var(--service-accent)]"
            : "pointer-events-none absolute inset-0 z-30 border-2"}
          style={{ borderColor: accent, "--service-accent": accent } as CSSProperties}
        />
      </div>

      <div
        data-what-service-copy
        className="relative z-10 mx-0 -mt-[2px] flex w-[min(72vw,19rem)] max-w-none flex-col items-start sm:w-[min(39vw,20rem)] lg:w-auto lg:max-w-[19rem]"
      >
        <h3
          className={`inline-block w-fit max-w-none whitespace-nowrap px-3 py-1 text-white ${TEXT_STYLES.link}`}
          style={{ backgroundColor: accent, color: textColor }}
        >
          {stegaClean(service.title)}
        </h3>
        {cleanServiceDescription && (
          touchActive ? (
            <div
              className={`w-full min-w-0 origin-top-left animate-[what-touch-copy-in_220ms_cubic-bezier(.22,1,.36,1)_both] whitespace-normal break-normal px-3 py-2 [hyphens:none] [overflow-wrap:normal] [text-wrap:pretty] ${TEXT_STYLES.body}`}
              style={{ backgroundColor: accent, color: textColor }}
            >
              {cleanServiceDescription}
            </div>
          ) : (
            <div className={`relative hidden w-auto max-w-xs lg:block ${TEXT_STYLES.body}`}>
              <div className="invisible whitespace-normal break-words px-3 py-2">
                {cleanServiceDescription}
              </div>
              <div
                className={`pointer-events-none absolute inset-0 origin-top-left whitespace-normal break-words px-3 py-2 transition-all duration-200 ${cardActive ? "scale-100 opacity-100 ease-out" : "scale-80 opacity-0 ease-in"}`}
                style={{ backgroundColor: accent, color: textColor }}
              >
                <TypeOnText
                  text={cleanServiceDescription}
                  trigger="hover"
                  speed={1.8}
                  hoverTargetRef={detectorRef}
                  className="!whitespace-normal break-words"
                />
              </div>
            </div>
          )
        )}
      </div>
    </article>
  );

  if (!href) return content;

  return (
    <Link href={href} target={service.link?.target ? "_blank" : undefined} className="block h-full">
      {content}
    </Link>
  );
}

export function WhatWeDoGridView({
  block,
  className = "",
}: {
  block: WhatWeDoGridBlock;
  className?: string;
}) {
  const accent = colorValue(block.accentColor, "#ff00d9");
  const background = colorValue(block.backgroundColor, "#e7e7e2");
  const services = (block.services || []).slice(0, 4);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const scrollEndTimerRef = useRef(0);
  const pointerDragRef = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
  });
  const suppressDragClickRef = useRef(false);
  const [touchActiveIndexes, setTouchActiveIndexes] = useState<number[]>([0]);
  const [touchLayout, setTouchLayout] = useState(false);
  const cleanDescription = stegaClean(block.description) || "";
  const descriptionLines = splitTextAtWordRatio(cleanDescription, 0.6);
  const mobileDescriptionLines = splitTextIntoBalancedLines(
    cleanDescription,
    3,
  );
  const tabletDescriptionLines = splitTextIntoBalancedLines(
    cleanDescription,
    2,
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    const heading = headingRef.current;
    if (!root || !heading) return;

    let frame = 0;
    const syncRailPosition = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (window.innerWidth >= 1024) {
          root.style.removeProperty("--what-touch-rail-top");
          return;
        }
        const rootBounds = root.getBoundingClientRect();
        const headingBounds = heading.getBoundingClientRect();
        const gap = window.innerWidth < 640 ? 38 : 58;
        root.style.setProperty(
          "--what-touch-rail-top",
          `${Math.ceil(headingBounds.bottom - rootBounds.top + gap)}px`,
        );
      });
    };

    const observer = new ResizeObserver(syncRailPosition);
    observer.observe(root);
    observer.observe(heading);
    window.addEventListener("resize", syncRailPosition);
    syncRailPosition();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", syncRailPosition);
      root.style.removeProperty("--what-touch-rail-top");
    };
  }, [cleanDescription]);

  const commitNearestTouchCard = () => {
    const carousel = carouselRef.current;
    if (!carousel || window.innerWidth >= 1024) return;
    const carouselBounds = carousel.getBoundingClientRect();
    const focusX = carouselBounds.left + carouselBounds.width * 0.48;
    const cards = Array.from(
      carousel.querySelectorAll<HTMLElement>("[data-what-service-slide]"),
    );
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const bounds = card.getBoundingClientRect();
      const distance = Math.abs(bounds.left + bounds.width / 2 - focusX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    if (window.innerWidth >= 640) {
      const visibleIndexes = cards.flatMap((card, index) => {
        const bounds = card.getBoundingClientRect();
        const visibleWidth = Math.max(
          0,
          Math.min(bounds.right, carouselBounds.right) -
            Math.max(bounds.left, carouselBounds.left),
        );
        return visibleWidth / Math.max(1, bounds.width) >= 0.18
          ? [index]
          : [];
      });
      setTouchActiveIndexes(
        visibleIndexes.length ? visibleIndexes : [closestIndex],
      );
    } else {
      setTouchActiveIndexes([closestIndex]);
    }
  };

  useEffect(() => {
    let layoutFrame = 0;
    const updateLayout = () => {
      setTouchLayout(window.innerWidth < 1024);
      cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(commitNearestTouchCard);
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => {
      window.removeEventListener("resize", updateLayout);
      cancelAnimationFrame(layoutFrame);
      window.clearTimeout(scrollEndTimerRef.current);
    };
  }, []);

  const updateTouchActiveCard = () => {
    // Keep the current layer active for the whole gesture. Changing z-index
    // while momentum scroll is running made the pants appear to flip between
    // the foreground and background on mobile.
    window.clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = window.setTimeout(
      commitNearestTouchCard,
      140,
    );
  };

  const activateTouchCard = (index: number) => {
    setTouchActiveIndexes((current) =>
      window.innerWidth >= 640
        ? Array.from(new Set([...current, index])).sort((a, b) => a - b)
        : [index],
    );
    const carousel = carouselRef.current;
    const card = carousel?.querySelectorAll<HTMLElement>(
      "[data-what-service-slide]",
    )[index];
    if (carousel && card) {
      carousel.scrollTo({
        left:
          card.offsetLeft -
          (carousel.clientWidth - card.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  };

  const beginPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === "touch" ||
      window.innerWidth >= 1024 ||
      event.button !== 0
    ) {
      return;
    }
    const carousel = carouselRef.current;
    if (!carousel) return;
    pointerDragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: carousel.scrollLeft,
    };
    carousel.style.scrollSnapType = "none";
    carousel.setPointerCapture(event.pointerId);
  };

  const movePointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    const drag = pointerDragRef.current;
    if (
      !carousel ||
      !drag.active ||
      drag.pointerId !== event.pointerId
    ) {
      return;
    }
    const movement = event.clientX - drag.startX;
    if (Math.abs(movement) > 4) {
      drag.moved = true;
      suppressDragClickRef.current = true;
      event.preventDefault();
    }
    carousel.scrollLeft = drag.startScrollLeft - movement;
  };

  const endPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    const drag = pointerDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    drag.active = false;
    if (carousel?.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
    carousel?.style.removeProperty("scroll-snap-type");
    updateTouchActiveCard();
    window.setTimeout(() => {
      suppressDragClickRef.current = false;
    }, 0);
  };

  return (
    <div
      ref={rootRef}
      className={`relative h-full min-h-[100svh] overflow-hidden text-black ${className}`}
      style={{ backgroundColor: background }}
    >
      <LayeredBackground block={block} />
      <FlyingPigeonScene />
      <PizzaRatScene />

      <div
        ref={headingRef}
        data-what-heading
        className="absolute inset-x-3 top-[10%] z-40 flex flex-col items-center text-center sm:inset-x-4 sm:top-[12%] lg:top-[16.5%]"
        style={{ "--what-accent": accent } as CSSProperties}
      >
        <TitleText
          variant="stretched"
          as="h2"
          size="what-we-do"
          align="center"
          maxChars={12}
          animation="none"
          fontWeight="bold"
          textColor="#ffffff"
          className="!w-auto [&_h2]:leading-[.78] [&_h2]:tracking-[-.055em] [&_h2>span]:bg-[var(--what-accent)] [&_h2>span]:px-[.1em] [&_h2>span]:pb-[.035em] [&_h2>span]:pt-[.06em]"
        >
          {stegaClean(block.heading) || "WHAT WE DO"}
        </TitleText>
        {cleanDescription && (
          <p
            className={`mt-2 inline-block w-fit max-w-[min(86vw,36rem)] px-3 py-2 text-white sm:mt-3 sm:max-w-[min(84vw,36rem)] sm:px-4 lg:max-w-[36rem] ${SECTION_HEADER_BODY_TYPE_CLASS}`}
            style={{ backgroundColor: accent }}
          >
            <span className="sm:hidden">
              {mobileDescriptionLines.map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </span>
            <span className="hidden sm:inline lg:hidden">
              {tabletDescriptionLines.map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </span>
            <span className="hidden lg:inline">
              {descriptionLines.map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </span>
          </p>
        )}
      </div>

      <div
        ref={carouselRef}
        onScroll={updateTouchActiveCard}
        onPointerDown={beginPointerDrag}
        onPointerMove={movePointerDrag}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onClickCapture={(event) => {
          if (suppressDragClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onDragStart={(event) => event.preventDefault()}
        className="absolute inset-x-0 bottom-[1%] top-[var(--what-touch-rail-top,30%)] z-[60] flex cursor-grab snap-x snap-mandatory scroll-px-[14vw] gap-[4vw] overflow-x-scroll overflow-y-hidden px-[14vw] pb-8 pt-2 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:scroll-px-[4vw] sm:gap-[4vw] sm:px-[4vw] lg:inset-x-[max(2rem,calc((100%_-_80rem)/2))] lg:bottom-[4%] lg:top-[40%] lg:z-auto lg:grid lg:cursor-auto lg:grid-cols-4 lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0 lg:scroll-px-0"
      >
        {services.map((service, index) => (
          <div
            key={service._key}
            data-what-service-slide
            className="h-full w-[72vw] shrink-0 snap-start [scroll-snap-stop:always] sm:w-[39vw] lg:w-auto"
          >
            <ServiceCard
              service={service}
              accent={accent}
              touchActive={
                touchLayout && touchActiveIndexes.includes(index)
              }
              desktopFill={index === services.length - 1}
              onTouchActivate={() => activateTouchCard(index)}
            />
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes what-touch-copy-in {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 1023px) {
          [data-what-service-image] {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function WhatWeDoGridSection(block: WhatWeDoGridBlock) {
  const id = stegaClean(block.anchor?.anchorId) || `_what-we-do-grid-${block._key}`;

  return (
    <section id={id} className="relative min-h-[100svh] overflow-hidden">
      <WhatWeDoGridView block={block} />
    </section>
  );
}
