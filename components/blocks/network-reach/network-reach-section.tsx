"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERYResult } from "@/sanity.types";
import EyeFollow from "@/components/effects/eye-follow";
import TitleText from "@/components/ui/title-text";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type NetworkReachBlock = Extract<PageBlock, { _type: "network-reach-section" }>;
type ReachPoint = NonNullable<NetworkReachBlock["reachPoints"]>[number];

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

function cleanColor(
  color: { hex?: string | null } | null | undefined,
  fallback: string,
) {
  return stegaClean(color?.hex) || fallback;
}

export default function NetworkReachSection(props: NetworkReachBlock) {
  const rootRef = useRef<HTMLElement | null>(null);
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
  const friends = (props.friends ?? []).filter(
    (friend) => friend.image?.asset?.url,
  );
  const displayedFriends = friends.length
    ? Array.from(
        { length: Math.max(10, friends.length) },
        (_, index) => friends[index % friends.length],
      )
    : [];
  const orbitDuration = Math.min(
    90,
    Math.max(12, stegaClean(props.orbitDuration) || 28),
  );
  const orbitTilt = Math.min(
    82,
    Math.max(45, stegaClean(props.orbitTilt) || 48),
  );
  const orbitStyle = {
    "--network-orbit-duration": `${orbitDuration}s`,
    "--network-orbit-tilt": `${orbitTilt}deg`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const title = root.querySelector<HTMLElement>(
        "[data-network-intro-title]",
      );
      const body = root.querySelector<HTMLElement>(
        "[data-network-intro-body]",
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (!title || !body || reduceMotion) {
        gsap.set([title, body].filter(Boolean), { clearProps: "transform" });
        return;
      }

      gsap.fromTo(
        title,
        { y: 72 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "top 38%",
            scrub: 0.65,
            invalidateOnRefresh: true,
          },
        },
      );

      gsap.fromTo(
        body,
        { y: 112 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "top 31%",
            scrub: 1.05,
            invalidateOnRefresh: true,
          },
        },
      );
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id={sectionId}
      className="relative isolate bg-background p-3 sm:p-4 lg:p-6"
    >
      <div
        className="relative overflow-hidden rounded-none border border-current"
        style={{ backgroundColor, color: textColor }}
      >
        <div
          id={eyeAreaId}
          className="relative min-h-[27rem] cursor-crosshair"
        >
          <EyeFollow
            containerId={eyeAreaId}
            eyes={props.eyes ?? []}
            enableClickToAdd={stegaClean(props.enableClickToAddEyes) !== false}
            minSpawnScale={stegaClean(props.eyeSpawnMinScale) || 0.55}
            maxSpawnScale={stegaClean(props.eyeSpawnMaxScale) || 1.35}
            avoidSpawnOverlap
            rollOnExistingClick
            spawnGap={12}
            edgePadding={12}
            staggerOnEnter
          />

          <div className="pointer-events-none absolute inset-x-4 top-[5.25rem] z-20 mx-auto flex max-w-[54rem] flex-col items-center text-center sm:top-[5.75rem] lg:top-[6.25rem]">
            <div data-network-intro-title className="flex flex-col items-center">
              {props.eyebrow && (
                <TitleText
                  variant="stretched"
                  size="network-eyebrow"
                  as="p"
                  maxChars={22}
                  fontWeight="bold"
                  stretchScaleX={0.8}
                  overallScale={1}
                  className="!w-auto [&_p]:leading-[.84] [&_p]:tracking-[-.04em]"
                >
                  {stegaClean(props.eyebrow)}
                </TitleText>
              )}
              <TitleText
                variant="stretched"
                size="network-lead"
                as="p"
                maxChars={22}
                fontWeight="bold"
                stretchScaleX={0.8}
                overallScale={1}
                className="!mt-3 !w-auto [&_p]:leading-[.82] [&_p]:tracking-[-.05em]"
              >
                {stegaClean(props.headlineLead) || "OUR WORK TO"}
              </TitleText>
              <TitleText
                variant="stretched"
                size="network-main"
                as="h2"
                maxChars={16}
                fontWeight="bold"
                stretchScaleX={0.8}
                overallScale={1}
                className="!mt-3 !w-auto [&_h2]:leading-[.72] [&_h2]:tracking-[-.06em]"
              >
                {stegaClean(props.headlineMain) || "MILLIONS"}
              </TitleText>
            </div>
            {props.description && (
              <p
                data-network-intro-body
                className="mt-6 max-w-[34rem] text-[1rem] font-medium leading-[1.1] tracking-[-.025em] sm:text-[1.15rem] lg:text-[1.3rem]"
              >
                {stegaClean(props.description)}
              </p>
            )}
          </div>
        </div>

        <div className="relative mx-auto min-h-[42rem] max-w-[94rem] px-3 sm:min-h-[46rem] sm:px-6 lg:min-h-[50rem] lg:px-10">
          <div
            className="network-orbit-stage absolute inset-x-0 top-0 h-[29rem] sm:h-[31rem] lg:h-[34rem]"
            style={orbitStyle}
          >
            <div className="network-orbit-plane absolute left-1/2 top-[38%] h-px w-px">
              <div className="network-orbit-ring absolute left-0 top-0 h-px w-px">
                {reachPoints.map((point, index) => {
                  const cleanAngle = stegaClean(point.angle);
                  const angle =
                    typeof cleanAngle === "number"
                      ? cleanAngle
                      : (index / reachPoints.length) * 360;

                  return (
                    <div
                      key={point._key}
                      className="network-orbit-position absolute left-0 top-0"
                      style={
                        {
                          "--network-point-angle": `${angle}deg`,
                        } as CSSProperties
                      }
                    >
                      <span className="network-reach-line absolute left-0 block w-[2px] origin-top bg-current" />
                      <div className="network-angle-counter absolute left-0 top-0">
                        <div className="network-time-counter absolute left-0 top-0">
                          <div className="network-orbit-billboard absolute left-0 top-0">
                            <div className="w-[clamp(8rem,14vw,12rem)] -translate-x-1/2 -translate-y-1/2 text-center">
                              <TitleText
                                variant="stretched"
                                size="network-reach"
                                as="p"
                                maxChars={16}
                                fontWeight="bold"
                                stretchScaleX={0.68}
                                overallScale={1.04}
                                className="!w-auto [&_p]:whitespace-nowrap [&_p]:leading-[.78] [&_p]:tracking-[-.06em]"
                              >
                                {stegaClean(point.value) || "0+"}
                              </TitleText>
                              <p className="mt-1 text-[.68rem] font-bold uppercase leading-[.88] tracking-[-.025em] sm:text-[.82rem] lg:text-[.95rem]">
                                {stegaClean(point.label)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute left-1/2 top-[38%] z-20 h-[15rem] w-[13.5rem] -translate-x-1/2 -translate-y-1/2 sm:h-[18rem] sm:w-[16rem] lg:h-[21rem] lg:w-[18.75rem]">
              {props.brandImage?.asset?.url ? (
                <Image
                  src={props.brandImage.asset.url}
                  alt={stegaClean(props.brandImage.alt) || "Your brand"}
                  fill
                  sizes="(min-width: 1024px) 208px, 144px"
                  className="object-contain object-bottom"
                />
              ) : (
                <Image
                  src="/images/network-reach-brand.png"
                  alt="Your brand"
                  fill
                  sizes="(min-width: 1024px) 208px, 144px"
                  className="object-contain object-bottom"
                />
              )}
              <p className="absolute inset-0 z-10 flex items-center justify-center whitespace-pre-line px-2 text-center text-[clamp(1.55rem,2.35vw,2.6rem)] font-bold uppercase leading-[.83] tracking-[-.06em] text-white [-webkit-text-stroke:2px_#111] [paint-order:stroke_fill]">
                {stegaClean(props.brandLabel) || "YOUR\nBRAND\nGOES HERE"}
              </p>
            </div>
          </div>

          <div className="absolute inset-x-3 top-[33rem] z-30 grid -translate-y-1/2 grid-cols-3 place-items-center gap-1 sm:inset-x-8 sm:top-[36rem] sm:gap-6 lg:inset-x-12 lg:top-[41rem] lg:gap-12">
            {detailStats.slice(0, 5).map((stat, index) => (
              <div
                key={stat._key || `${stat.title}-${index}`}
                className="relative flex h-[clamp(7.5rem,27vw,10rem)] w-[clamp(7.5rem,27vw,10rem)] items-center justify-center px-3 text-center sm:h-[clamp(10rem,15vw,13.5rem)] sm:w-[clamp(10rem,15vw,13.5rem)] sm:px-7"
              >
                <div
                  className="absolute inset-[8%] z-0 scale-x-[1.45] scale-y-[.9] blur-sm"
                  aria-hidden="true"
                >
                  <div className="h-full w-full bg-white [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" />
                </div>
                <div className="relative z-10 max-w-[7.5rem]">
                  <p className="text-[clamp(.76rem,1vw,1rem)] font-bold uppercase leading-none">
                    {stegaClean(stat.title)}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-[clamp(.7rem,.88vw,.92rem)] font-medium uppercase leading-[1.02]">
                    {stegaClean(stat.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[27rem] max-w-[96rem] flex-col items-center justify-end px-2 pt-10 text-center sm:min-h-[28rem] sm:px-6 lg:min-h-[28rem] lg:px-8 lg:pt-12">
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
              outlineWidth={1.25}
              outlinePosition="outside"
              stretchScaleX={0.72}
              overallScale={1.04}
              className="!w-auto sm:[&_h2]:whitespace-nowrap [&_h2]:leading-[.78] [&_h2]:tracking-[-.055em]"
            >
              {stegaClean(props.friendsTitle) || "AND WE BRING FRIENDS"}
            </TitleText>
            {props.friendsDescription && (
              <p className="mt-6 max-w-[34rem] text-[1rem] font-medium leading-[1.1] tracking-[-.025em] sm:text-[1.15rem] lg:text-[1.3rem]">
                {stegaClean(props.friendsDescription)}
              </p>
            )}
          </div>

          {displayedFriends.length > 0 && (
            <div className="network-friends-row relative mt-3 flex h-[clamp(10rem,15vw,14.5rem)] w-full items-end justify-center overflow-hidden px-1 sm:mt-4 sm:px-3">
              {displayedFriends.map((friend, index) => (
                <div
                  key={`${friend._key}-${index}`}
                  className="network-friend-cutout relative h-full w-[clamp(5.5rem,9.5vw,9.5rem)] flex-none overflow-hidden"
                  style={{ zIndex: index + 1 }}
                >
                  <Image
                    src={friend.image!.asset!.url!}
                    alt={
                      index < friends.length
                        ? stegaClean(friend.image?.alt) ||
                          stegaClean(friend.name) ||
                          "Network friend"
                        : ""
                    }
                    fill
                    sizes="(min-width: 1024px) 152px, 88px"
                    className="object-cover object-top"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .network-orbit-stage {
          perspective: 1100px;
          transform-style: preserve-3d;
        }

        .network-orbit-plane {
          transform: rotateX(var(--network-orbit-tilt));
          transform-style: preserve-3d;
        }

        .network-orbit-ring {
          --network-orbit-radius: clamp(10.5rem, 27vw, 22rem);
          --network-orbit-x-scale: 1.08;
          --network-orbit-x-scale-inverse: 0.926;
          --network-line-label-gap: 4rem;
          --network-line-center-gap: 4rem;
          animation: network-orbit var(--network-orbit-duration) linear infinite;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .network-orbit-position {
          transform: rotate(var(--network-point-angle))
            translateY(calc(var(--network-orbit-radius) * -1));
          transform-origin: 0 0;
          transform-style: preserve-3d;
        }

        .network-angle-counter {
          transform: rotate(calc(var(--network-point-angle) * -1));
          transform-style: preserve-3d;
        }

        .network-time-counter {
          animation: network-counter-orbit var(--network-orbit-duration) linear
            infinite;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .network-orbit-billboard {
          transform: scaleX(var(--network-orbit-x-scale-inverse))
            rotateX(calc(var(--network-orbit-tilt) * -1));
          transform-style: preserve-3d;
        }

        .network-reach-line {
          top: var(--network-line-label-gap);
          height: max(
            0px,
            calc(
              var(--network-orbit-radius) - var(--network-line-label-gap) -
                var(--network-line-center-gap)
            )
          );
        }

        @media (min-width: 640px) {
          .network-orbit-ring {
            --network-orbit-x-scale: 1.16;
            --network-orbit-x-scale-inverse: 0.862;
            --network-line-label-gap: 5rem;
            --network-line-center-gap: 5rem;
          }
        }

        @media (min-width: 1024px) {
          .network-orbit-ring {
            --network-orbit-x-scale: 1.25;
            --network-orbit-x-scale-inverse: 0.8;
            --network-line-label-gap: 7.5rem;
            --network-line-center-gap: 8.5rem;
          }
        }

        .network-friend-cutout + .network-friend-cutout {
          margin-left: clamp(-2.4rem, -2.2vw, -1.15rem);
        }

        @keyframes network-orbit {
          from {
            transform: scaleX(var(--network-orbit-x-scale)) rotate(0deg);
          }

          to {
            transform: scaleX(var(--network-orbit-x-scale)) rotate(360deg);
          }
        }

        @keyframes network-counter-orbit {
          to {
            transform: rotate(-360deg);
          }
        }

        @media (max-width: 639px) {
          .network-orbit-ring {
            --network-orbit-radius: clamp(9.5rem, 42vw, 11rem);
          }

          .network-friend-cutout + .network-friend-cutout {
            margin-left: -1.35rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .network-orbit-ring,
          .network-time-counter {
            animation-play-state: paused;
          }
        }
      `}</style>
    </section>
  );
}
