"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERYResult } from "@/sanity.types";
import NetworkPhoneScene from "./network-phone-scene";
import styles from "./network-friends.module.css";
import EyeFollow from "@/components/effects/eye-follow";
import TitleText from "@/components/ui/title-text";
import TypeOnText, { TYPE_ON_SPEEDS } from "@/components/ui/type-on-text";
import { splitTextAtWordRatio } from "@/components/blocks/shared/text-lines";
import {
  SECTION_HEADER_BODY_CLASS,
  DISPLAY_OUTLINE_WIDTHS,
  TEXT_STYLES,
} from "@/components/ui/text-styles";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type NetworkReachBlock = Extract<PageBlock, { _type: "network-reach-section" }>;
type ReachPoint = NonNullable<NetworkReachBlock["reachPoints"]>[number];

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const fallbackPoints: ReachPoint[] = [
  {
    _key: "fallback-followers",
    value: "218,000+",
    label: "FOLLOWERS",
    angle: 270,
  },
  {
    _key: "fallback-impressions",
    value: "50 MILLION+",
    label: "MONTHLY IMPRESSIONS",
    angle: 32,
  },
  {
    _key: "fallback-shares",
    value: "126,000+",
    label: "MONTHLY SHARES",
    angle: 142,
  },
];

const fallbackDetailStats = [
  { _key: "fallback-age", title: "AGE GROUPS", value: "80% 25–44\n17% 18–24" },
  {
    _key: "fallback-countries",
    title: "TOP COUNTRIES",
    value: "USA, UK, GERMANY,\nITALY",
  },
  {
    _key: "fallback-cities",
    title: "TOP CITIES",
    value: "NYC, LONDON, PARIS,\nBERLIN, LA",
  },
];

// Handles supplied in the approved source filenames; no CMS changes needed.
const FRIENDS = [
  {
    file: "gucci_pineapple",
    handle: "gucci_pineapple",
    width: 254,
    height: 317,
    alt: "Community member crouching with a Popeyes cup",
  },
  {
    file: "winnie_thepooj",
    handle: "winnie_thepooj",
    width: 171,
    height: 306,
    alt: "Community member with a basketball in a PATHETIC T-shirt",
  },
  {
    file: "kael_fangs",
    handle: "kael_fangs",
    width: 247,
    height: 369,
    alt: "Two community members in furry costumes and PATHETIC T-shirts",
  },
  {
    file: "thejeanluc",
    handle: "thejeanluc",
    width: 137,
    height: 358,
    alt: "Community member waving in a graphic top and jeans",
  },
  {
    file: "brettneustrom",
    handle: "brettneustrom",
    width: 114,
    height: 353,
    alt: "Community member wearing sunglasses and denim shorts",
  },
  {
    file: "racheltokar_",
    handle: "racheltokar_",
    width: 116,
    height: 161,
    alt: "Community member leaning forward in a white hoodie",
  },
] as const;

const NETWORK_FLOAT_EFFECTS = {
  intro: { enabled: false, speed: 0.9, lag: 0.2 },
} as const;

const FRIEND_LABEL_POSITIONS = [[49, 68], [44, 36], [51, 61], [52, 30], [46, 52], [49, 77]] as const;

function cleanColor(
  color: { hex?: string | null } | null | undefined,
  fallback: string,
) {
  return stegaClean(color?.hex) || fallback;
}

export default function NetworkReachSection(props: NetworkReachBlock) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [introVisible, setIntroVisible] = useState(false);
  const introEyes = useMemo(() => {
    const positions = [
      [16, 12, 52],
      [80, 13, 64],
      [12, 39, 28],
      [91, 39, 28],
      [15, 87, 54],
      [87, 87, 42],
      [50, 8, 28],
    ];
    return (props.eyes ?? []).map((eye, index) => {
      const [xMobile, yMobile, sizeMobile] =
        positions[index % positions.length];
      return { ...eye, xMobile, yMobile, sizeMobile };
    });
  }, [props.eyes]);
  useEffect(() => {
    const intro = rootRef.current?.querySelector("[data-network-intro]");
    if (!intro) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntroVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(intro);
    return () => observer.disconnect();
  }, []);
  const backgroundColor = cleanColor(props.backgroundColor, "#D8FF56");
  const textColor = cleanColor(props.textColor, "#050505");
  const sectionId =
    stegaClean(props.anchor?.anchorId) || `_network-reach-${props._key}`;
  const eyeAreaId = `${sectionId}-eyes`;
  const reachPoints = props.reachPoints?.length
    ? props.reachPoints
    : fallbackPoints;
  const detailStats = props.detailStats?.length
    ? props.detailStats
    : fallbackDetailStats;
  // Keep this revision local to the feature branch; no Sanity mutation needed.
  const cleanDescription =
    "We distribute our work through @PATHETIC, our Instagram community that reaches 50 million people every month.";
  const descriptionLines = splitTextAtWordRatio(cleanDescription, 0.57);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const listenerCleanups: Array<() => void> = [];

    const context = gsap.context(() => {
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches && navigator.maxTouchPoints === 0;
      root.dataset.touchLabels = String(!finePointer);
      const friendItems = gsap.utils.toArray<HTMLElement>(
        "[data-network-friend]",
        root,
      );
      if (finePointer)
        friendItems.forEach((item) => {
          const tag = item.querySelector<HTMLElement>(
            "[data-network-friend-tag]",
          );
          const visual = item.querySelector<HTMLElement>(
            "[data-network-friend-visual]",
          );
          if (!tag) return;

          if (visual) {
            gsap.set(visual, { transformOrigin: "50% 100%" });
          }

          gsap.set(tag, {
            autoAlpha: 0,
            scale: 0.78,
            xPercent: -50,
            yPercent: -118,
            transformOrigin: "50% 100%",
          });
          const moveX = gsap.quickTo(tag, "x", {
            duration: 0.42,
            ease: "power3.out",
          });
          const moveY = gsap.quickTo(tag, "y", {
            duration: 0.42,
            ease: "power3.out",
          });

          const onMove = (event: PointerEvent) => {
            const bounds = item.getBoundingClientRect();
            moveX(event.clientX - bounds.left);
            moveY(event.clientY - bounds.top);
          };
          const onEnter = (event: PointerEvent) => {
            onMove(event);
            if (visual) {
              gsap.to(visual, {
                y: -9,
                scale: 1.045,
                duration: 0.3,
                ease: "power3.out",
                overwrite: "auto",
              });
            }
            gsap.to(tag, {
              autoAlpha: 1,
              scale: 1,
              duration: 0.22,
              ease: "back.out(1.8)",
              overwrite: "auto",
            });
          };
          const onLeave = () => {
            if (visual) {
              gsap.to(visual, {
                y: 0,
                scale: 1,
                duration: 0.26,
                ease: "power3.out",
                overwrite: "auto",
              });
            }
            gsap.to(tag, {
              autoAlpha: 0,
              scale: 0.82,
              duration: 0.16,
              ease: "power2.in",
              overwrite: "auto",
            });
          };

          item.addEventListener("pointerenter", onEnter);
          item.addEventListener("pointermove", onMove);
          item.addEventListener("pointerleave", onLeave);

          listenerCleanups.push(() => {
            item.removeEventListener("pointerenter", onEnter);
            item.removeEventListener("pointermove", onMove);
            item.removeEventListener("pointerleave", onLeave);
          });
        });
    }, root);

    return () => {
      listenerCleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id={sectionId}
      className="relative isolate bg-background p-2.5 sm:p-4 lg:p-6"
    >
      <div
        className="relative overflow-hidden rounded-none border border-current before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[100] before:h-px before:bg-current before:content-['']"
        style={{ backgroundColor, color: textColor }}
      >
        <div
          id={eyeAreaId}
          className="relative min-h-[27rem] cursor-default sm:min-h-[29rem] sm:cursor-crosshair lg:min-h-[33rem]"
        >
          <EyeFollow
            containerId={eyeAreaId}
            eyes={introEyes}
            enableClickToAdd={stegaClean(props.enableClickToAddEyes) !== false}
            minSpawnScale={stegaClean(props.eyeSpawnMinScale) || 0.55}
            maxSpawnScale={stegaClean(props.eyeSpawnMaxScale) || 1.35}
            avoidSpawnOverlap
            rollOnExistingClick
            spawnGap={12}
            edgePadding={12}
            staggerOnEnter
            staggerEnterDelayMs={80}
            staggerEnterRootMargin="0px 0px -8% 0px"
          />

          <div
            data-network-intro
            data-typeon-trigger="true"
            data-network-float="intro"
            data-speed={
              NETWORK_FLOAT_EFFECTS.intro.enabled
                ? NETWORK_FLOAT_EFFECTS.intro.speed
                : undefined
            }
            data-lag={
              NETWORK_FLOAT_EFFECTS.intro.enabled
                ? NETWORK_FLOAT_EFFECTS.intro.lag
                : undefined
            }
            className="pointer-events-none relative z-20 mx-auto flex max-w-[54rem] flex-col items-center px-3 pb-0 pt-[clamp(5.75rem,12vw,10rem)] text-center will-change-transform sm:px-4"
          >
            <div
              data-network-intro-title
              aria-label="Our Unfair Advantage"
              className="flex flex-col items-center"
            >
              <TitleText
                variant="stretched"
                size="network-eyebrow"
                as="p"
                maxChars={22}
                fontWeight="bold"
                stretchScaleX={0.8}
                overallScale={1}
                animation={introVisible ? "typeOn" : "none"}
                animationSpeed={TYPE_ON_SPEEDS.rapid}
                typeOnTrigger="immediate"
                typeOnStart="top 90%"
                typeOnDelay={0}
                className="!w-auto [&_p]:leading-[.84] [&_p]:tracking-[-.04em]"
              >
                OUR
              </TitleText>
              <TitleText
                variant="stretched"
                size="network-lead"
                as="p"
                maxChars={22}
                fontWeight="bold"
                stretchScaleX={0.8}
                overallScale={1}
                animation={introVisible ? "typeOn" : "none"}
                animationSpeed={TYPE_ON_SPEEDS.rapid}
                typeOnTrigger="immediate"
                typeOnStart="top 90%"
                typeOnDelay={0.06}
                className="!mt-3 !w-auto [&_p]:leading-[.82] [&_p]:tracking-[-.05em]"
              >
                UNFAIR
              </TitleText>
              <TitleText
                variant="stretched"
                size="network-main"
                singleLine
                as="h2"
                maxChars={16}
                fontWeight="bold"
                stretchScaleX={0.8}
                overallScale={1}
                animation={introVisible ? "typeOn" : "none"}
                animationSpeed={TYPE_ON_SPEEDS.rapid}
                typeOnTrigger="immediate"
                typeOnStart="top 90%"
                typeOnDelay={0.12}
                className="!mt-3 !w-auto max-sm:[&_h2]:!text-[16vw] [&_h2]:leading-[.72] [&_h2]:tracking-[-.06em]"
              >
                ADVANTAGE
              </TitleText>
            </div>
            {cleanDescription && (
              <p
                data-network-intro-body
                className={`mt-5 sm:mt-6 ${SECTION_HEADER_BODY_CLASS}`}
              >
                {descriptionLines.map((line, index) => {
                  const previousCharacters = descriptionLines
                    .slice(0, index)
                    .reduce(
                      (total, previousLine) => total + previousLine.length,
                      0,
                    );
                  return (
                    <span key={`${line}-${index}`} className="lg:block">
                      {introVisible ? (
                        <TypeOnText
                          trigger="immediate"
                          text={line}
                          speed={TYPE_ON_SPEEDS.rapid}
                          delay={
                            0.42 +
                            previousCharacters * (0.04 / TYPE_ON_SPEEDS.rapid)
                          }
                          start="top 90%"
                        />
                      ) : (
                        line
                      )}
                      {index < descriptionLines.length - 1 && (
                        <span className="lg:hidden"> </span>
                      )}
                    </span>
                  );
                })}
              </p>
            )}
          </div>
        </div>

        <NetworkPhoneScene
          reachPoints={reachPoints.map((point) => ({
            key: point._key,
            value: stegaClean(point.value) || "",
            label: stegaClean(point.label) || "",
          }))}
          detailStats={detailStats.map((stat) => ({
            key: stat._key,
            title: stegaClean(stat.title) || "",
            value: stegaClean(stat.value) || "",
          }))}
        />

        <div className="relative mx-auto flex min-h-[25rem] max-w-[96rem] flex-col items-center justify-end px-2 pb-[clamp(2.5rem,4vw,4rem)] pt-8 text-center sm:min-h-[28rem] sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          <div className="mb-auto flex w-full max-w-[90rem] flex-col items-center">
            <TitleText
              variant="stretched"
              size="network-friends"
              as="h2"
              maxChars={30}
              fontWeight="bold"
              textColor="#ffffff"
              textOutline
              outlineColor={textColor}
              outlineWidth={DISPLAY_OUTLINE_WIDTHS.large}
              outlinePosition="outside"
              stretchScaleX={0.72}
              overallScale={1.04}
              className="!w-auto sm:[&_h2]:whitespace-nowrap [&_h2]:leading-[.78] [&_h2]:tracking-[-.055em]"
            >
              {stegaClean(props.friendsTitle) || "AND WE BRING FRIENDS"}
            </TitleText>
            {props.friendsDescription && (
              <p className={`mt-4 sm:mt-6 ${SECTION_HEADER_BODY_CLASS}`}>
                {stegaClean(props.friendsDescription)}
              </p>
            )}
          </div>

          <div className="network-friends-row relative mt-8 grid w-full max-w-[1050px] grid-cols-3 items-end justify-items-center gap-x-1 gap-y-5 px-1 sm:flex sm:items-end sm:justify-center sm:gap-0">
            {FRIENDS.map((friend, index) => (
              <a
                key={friend.file}
                href={`https://www.instagram.com/${friend.handle}/`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit @${friend.handle} on Instagram`}
                data-network-friend
                className="group network-friend-cutout focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 relative flex h-[12rem] w-full items-end justify-center sm:h-[clamp(12rem,24vw,20rem)] sm:w-auto sm:flex-1"
                style={{
                  zIndex: index + 1,
                  "--friend-label-x": `${FRIEND_LABEL_POSITIONS[index][0]}%`,
                  "--friend-label-y": `${FRIEND_LABEL_POSITIONS[index][1]}%`,
                } as CSSProperties}
              >
                <div
                  data-network-friend-visual
                  className="flex h-full w-full items-end justify-center"
                >
                  <Image
                    src={`/images/network/friends/${friend.file}.webp`}
                    loading="eager"
                    alt={friend.alt}
                    width={friend.width}
                    height={friend.height}
                    sizes="(min-width: 1024px) 200px, (min-width: 640px) 130px, 110px"
                    className="h-auto max-h-full w-full object-contain object-bottom"
                    style={{ maxWidth: friend.width }}
                  />
                </div>
                <span
                  data-network-friend-tag
                  aria-hidden="true"
                  className={`${styles.tag} pointer-events-none absolute left-0 top-0 z-30 whitespace-nowrap border border-white bg-black px-2 py-1 text-white opacity-0 ${TEXT_STYLES.label}`}
                >
                  @{friend.handle}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
