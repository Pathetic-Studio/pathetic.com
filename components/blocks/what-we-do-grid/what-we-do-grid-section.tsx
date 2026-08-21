"use client";

import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { PAGE_QUERYResult } from "@/sanity.types";
import TypeOnText from "@/components/ui/type-on-text";
import { urlFor } from "@/sanity/lib/image";
import TitleText from "@/components/ui/title-text";
import { splitTextAtWordRatio } from "@/components/blocks/shared/text-lines";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
export type WhatWeDoGridBlock = Extract<
  PageBlock,
  { _type: "what-we-do-grid-section" }
>;

const safeNumber = (value: number | null | undefined, fallback: number) => {
  const clean = stegaClean(value);
  return typeof clean === "number" && Number.isFinite(clean) ? clean : fallback;
};

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
    src: "/images/what-we-do/pigeon.png",
    alt: "",
    className:
      "left-[5.5%] top-[7%] w-[clamp(3.25rem,5.5vw,5rem)]",
    depth: 0.18,
    endScale: 1.055,
    zIndex: 13,
    width: 106,
    height: 106,
  },
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
    src: "/images/what-we-do/pizza-rat.png",
    alt: "",
    className:
      "bottom-[-2.5%] left-[17%] w-[clamp(5rem,8.5vw,8.5rem)]",
    depth: 0.86,
    endScale: 1.18,
    zIndex: 24,
    width: 204,
    height: 204,
  },
  {
    src: "/images/what-we-do/trash-pile.png",
    alt: "",
    className:
      "bottom-[4%] right-[-14%] w-[clamp(16rem,28vw,28rem)]",
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
                  <div className="absolute bottom-0 left-1/2 w-1/2 -translate-x-1/2">
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
}: {
  service: NonNullable<WhatWeDoGridBlock["services"]>[number];
  accent: string;
}) {
  const detectorRef = useRef<HTMLDivElement | null>(null);
  const coordinatesRef = useRef<HTMLDivElement | null>(null);
  const href = stegaClean(service.link?.href) || "";
  const imageScale = safeNumber(service.imageScale, 1);
  const verticalOffset = safeNumber(service.verticalOffset, 0);
  const objectDetectHover = Boolean(stegaClean(service.objectDetectHover));
  const textColor = colorValue(service.accentTextColor, "#ffffff");
  const imageFrame = (() => {
    const width = service.image?.asset?.metadata?.dimensions?.width;
    const height = service.image?.asset?.metadata?.dimensions?.height;
    if (!width || !height) return { width: 190, height: 300, sourceWidth: 240 };
    const sourceWidth = (300 * width) / height;
    return {
      width: Math.max(1, Math.min(190, sourceWidth)),
      height: 300,
      sourceWidth,
    };
  })();

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
      data-typeon-hover="true"
      onPointerMove={updateDetector}
      className="group relative flex h-full min-w-0 flex-col items-start justify-end text-left will-change-transform lg:justify-start"
    >
      <div
        ref={detectorRef}
        className="relative h-[clamp(7.25rem,18svh,9.5rem)] w-full origin-bottom overflow-hidden lg:h-[var(--service-image-height)] lg:w-[var(--service-image-width)] lg:max-w-none"
        style={{
          "--service-image-width": `${imageFrame.width}px`,
          "--service-image-height": `${imageFrame.height}px`,
          transform: `translateY(${verticalOffset}%) scale(${imageScale})`,
        } as CSSProperties}
      >
        {service.image?.asset?.url ? (
          <div
            className="absolute bottom-0 left-1/2 h-full w-full -translate-x-1/2 lg:w-[var(--service-source-width)]"
            style={{ "--service-source-width": `${imageFrame.sourceWidth}px` } as CSSProperties}
          >
            <Image
              src={service.image.asset.url}
              alt={stegaClean(service.image.alt) || stegaClean(service.title) || ""}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-contain object-bottom lg:object-fill"
            />
          </div>
        ) : (
          <div className="absolute inset-x-[22%] bottom-0 top-[12%] border border-black/30 bg-black/10" />
        )}

        {objectDetectHover && service.hoverImage?.asset?.url && (
          <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div
              className="absolute bottom-0 left-1/2 h-full w-full -translate-x-1/2 lg:w-[var(--service-source-width)]"
              style={{ "--service-source-width": `${imageFrame.sourceWidth}px` } as CSSProperties}
            >
              <Image
                src={service.hoverImage.asset.url}
                alt={stegaClean(service.hoverImage.alt) || stegaClean(service.title) || ""}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-contain object-bottom lg:object-fill"
              />
              <div className="absolute inset-0 bg-[var(--service-accent)] opacity-30 mix-blend-soft-light" style={{ "--service-accent": accent } as CSSProperties} />
            </div>
          </div>
        )}

        {objectDetectHover && (
          <div className="pointer-events-none absolute inset-0 z-20 hidden opacity-0 transition-opacity duration-150 group-hover:opacity-100 lg:block">
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
          className="pointer-events-none absolute inset-0 z-30 border-2"
          style={{ borderColor: accent }}
        />
      </div>

      <div className="relative z-10 -mt-[2px] flex max-w-full flex-col items-start">
        <h3
          className="inline-flex max-w-full px-3 py-1 text-base font-semibold uppercase leading-none tracking-tight text-white"
          style={{ backgroundColor: accent, color: textColor }}
        >
          {stegaClean(service.title)}
        </h3>
        {service.description && (
          <div
            className="relative mt-0.5 hidden w-full max-w-xs text-base leading-tight lg:block"
          >
            <div className="invisible whitespace-pre-wrap px-3 py-2">{stegaClean(service.description)}</div>
            <div
              className="pointer-events-none absolute inset-0 origin-top-left scale-80 whitespace-pre-wrap px-3 py-2 opacity-0 transition-all duration-200 ease-in group-hover:scale-100 group-hover:opacity-100 group-hover:ease-out"
              style={{ backgroundColor: accent, color: textColor }}
            >
              <TypeOnText
                text={stegaClean(service.description) || ""}
                trigger="hover"
                speed={1.8}
              />
            </div>
          </div>
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
  const cleanDescription = stegaClean(block.description) || "";
  const descriptionLines = splitTextAtWordRatio(cleanDescription, 0.6);

  return (
    <div
      className={`relative h-full min-h-[100svh] overflow-hidden text-black ${className}`}
      style={{ backgroundColor: background }}
    >
      <LayeredBackground block={block} />

      <div
        data-what-heading
        className="absolute inset-x-4 top-[13%] z-40 flex flex-col items-center text-center lg:top-[19%]"
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
            className="mt-3 w-[90vw] max-w-[34rem] px-4 py-2 text-[clamp(1rem,1.3vw,1.3rem)] leading-[1.1] text-white lg:w-[clamp(31rem,37vw,34rem)]"
            style={{ backgroundColor: accent }}
          >
            {descriptionLines.map((line, index) => (
              <span key={`${line}-${index}`} className="lg:block">
                {line}
                {index < descriptionLines.length - 1 && (
                  <span className="lg:hidden"> </span>
                )}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="absolute inset-x-[3.5%] bottom-[3.5%] z-40 grid h-[61%] grid-cols-2 gap-x-3 gap-y-1 lg:inset-x-auto lg:left-1/2 lg:top-[43%] lg:h-auto lg:w-[calc(100%_-_4rem)] lg:max-w-7xl lg:-translate-x-1/2 lg:grid-cols-4 lg:gap-0">
        {services.map((service) => (
          <ServiceCard key={service._key} service={service} accent={accent} />
        ))}
      </div>
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
