"use client";

import Link from "next/link";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTransitionState } from "next-transition-router";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { CASE_STUDIES } from "@/lib/case-studies";
import { WORK_COLLECTION, WORK_MEDIA_FRAMES } from "@/lib/work-projects";
import TitleText from "@/components/ui/title-text";
import ProjectMedia from "@/components/blocks/what-we-do/work-project-media";
import WorkContentViewer, {
  type WorkViewerContent,
} from "@/components/blocks/what-we-do/work-content-viewer";
import {
  createWorkCollectionPhysics,
  type WorkFilter,
} from "./work-collection-physics";
import styles from "./work-collection.module.css";

// Reading order follows the original collage; slots compact around the centre
// as filters change. Artwork sizes and offsets keep the rows intentionally loose.
const OBJECT_LAYOUT = [
  { key: "whatWeDoRamp", size: 78, mobileSize: 100, offset: 18, nudge: -2 },
  {
    key: "local-bless-this-desk",
    size: 62,
    mobileSize: 88,
    offset: 76,
    nudge: 2,
  },
  { key: "local-sandbar", size: 90, mobileSize: 100, offset: 34, nudge: -3 },
  { key: "whatWeDoAdidas", size: 94, mobileSize: 88, offset: 92, nudge: 3 },
  { key: "whatWeDoDoorDash", size: 66, mobileSize: 70, offset: 72, nudge: 3 },
  { key: "local-square", size: 94, mobileSize: 100, offset: 12, nudge: -3 },
  { key: "local-cash-app", size: 94, mobileSize: 100, offset: 98, nudge: 2 },
  { key: "local-yom", size: 45, mobileSize: 62, offset: 44, nudge: -2 },
  { key: "air", size: 100, mobileSize: 100, offset: 16, nudge: 0 },
  { key: "sizzle", size: 100, mobileSize: 100, offset: 0, nudge: 0 },
];
const WORK_ITEMS = WORK_COLLECTION.map((item, index) => {
  const order = OBJECT_LAYOUT.findIndex((layout) => layout.key === item._key);
  const layout = OBJECT_LAYOUT[order] ?? {
    size: 80,
    mobileSize: 90,
    offset: (index % 4) * 24,
    nudge: 0,
  };
  return {
    ...layout,
    item,
    order: order < 0 ? OBJECT_LAYOUT.length + index : order,
  };
}).sort((a, b) => a.order - b.order);

export default function WorkCollection() {
  const root = useRef<HTMLDivElement>(null);
  const physics = useRef<ReturnType<typeof createWorkCollectionPhysics> | null>(
    null,
  );
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<WorkFilter>("all");
  const [viewer, setViewer] = useState<WorkViewerContent | null>(null);
  const closeViewer = useCallback(() => setViewer(null), []);
  const { stage } = useTransitionState();
  const popped = useRef(false);
  useLayoutEffect(() => {
    const page = root.current;
    const heading = page?.querySelector<HTMLElement>("header");
    if (!page || !heading) return;
    const update = () =>
      page.style.setProperty(
        "--work-heading-height",
        `${heading.offsetHeight}px`,
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const page = root.current;
    if (!page || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      page
        .querySelectorAll<HTMLElement>("[data-work-scroll]")
        .forEach((layer, index) => {
          const toy = layer.closest<HTMLElement>("[data-work-toy]")!;
          if (toy.dataset.workKey === "sizzle") return;
          const travel = () =>
            innerWidth < 768 ? 12 + (index % 3) * 4 : 48 + (index % 3) * 16;
          gsap.fromTo(
            layer,
            { y: travel },
            {
              y: () => -travel(),
              ease: "none",
              scrollTrigger: {
                trigger: toy,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.75,
                invalidateOnRefresh: true,
              },
            },
          );
        });
    }, page);
    return () => context.revert();
  }, []);
  useLayoutEffect(() => {
    if (!root.current) return;
    const api = createWorkCollectionPhysics(
      root.current,
      setPlaying,
      setBusy,
      setFilter,
    );
    physics.current = api;
    return () => {
      api.dispose();
      physics.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    if (stage === "leaving" || popped.current || !root.current) return;
    popped.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(
      root.current.querySelectorAll("[data-work-pop]"),
      { scale: 0 },
      {
        scale: 1,
        duration: 0.85,
        stagger: 0.075,
        ease: "elastic.out(1, 1)",
        clearProps: "transform",
      },
    );
    return () => {
      tween.kill();
      gsap.set(root.current?.querySelectorAll("[data-work-pop]") || [], {
        clearProps: "transform",
      });
    };
  }, [stage]);

  return (
    <div
      ref={root}
      className={styles.page}
      data-case-study-index
      data-gravity={playing}
      data-filter={filter}
      aria-busy={busy}
    >
      <header className={styles.heading}>
        <TitleText
          as="h1"
          variant="stretched"
          size="belief"
          singleLine
          maxChars={0}
          fontWeight="bold"
          animation="none"
        >
          OUR WORK
        </TitleText>
        <div className={styles.controls}>
          <select
            className={styles.filter}
            aria-label="Filter work"
            value={filter}
            disabled={busy}
            onChange={(event) =>
              physics.current?.setFilter(event.target.value as WorkFilter)
            }
          >
            <option value="all">All</option>
            <option value="clients">Clients</option>
            <option value="projects">Projects</option>
          </select>
          <button
            type="button"
            className={styles.toggle}
            data-work-gravity-toggle
            disabled={busy}
            aria-pressed={playing}
            aria-label={
              playing
                ? "Restore project positions"
                : "Drop the projects and play"
            }
            onClick={() => physics.current?.toggle()}
          >
            <svg
              viewBox="0 0 214.198 110.082"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <path
                d="M107.099 0L132.382 42.0475H214.198L148.007 68.0342L173.29 110.082L107.099 84.095L40.9082 110.082L66.1908 68.0342L0 42.0475H81.8164L107.099 0Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </header>
      <div className={styles.field} data-work-field>
        <div className={styles.list} role="list" aria-label="Our work">
          {WORK_ITEMS.map(
            ({ item, size, mobileSize, offset, nudge }, index) => {
              const frame = WORK_MEDIA_FRAMES[item._key];
              const href = item.caseStudyHref || item.href;
              const slug = href?.split("/").at(-1)?.split("#")[0];
              const study = CASE_STUDIES.find((study) => study.slug === slug);
              const comingSoon =
                item._key === "whatWeDoDoorDash" ||
                item._key === "whatWeDoAdidas";
              const content = (
                <>
                  <div
                    className={styles.art}
                    data-work-art
                    style={
                      {
                        "--ratio":
                          frame?.ratio ||
                          (item.aspectRatio === "portrait"
                            ? 9 / 16
                            : item._key === "sizzle"
                              ? 900 / 529
                              : 4 / 3),
                        "--art-width": `${(frame?.width ?? 1) * 100}%`,
                      } as CSSProperties
                    }
                  >
                    <ProjectMedia
                      item={item}
                      suspended={!!viewer || stage === "leaving"}
                    />
                  </div>
                  <span className={styles.label} data-work-label>
                    {item.title}
                    {comingSoon && (
                      <span className={styles.soon}>Coming soon</span>
                    )}
                  </span>
                </>
              );
              return (
                <div
                  key={item._key}
                  role="listitem"
                  className={styles.toy}
                  data-work-toy
                  data-work-key={item._key}
                  data-work-kind={
                    item._key === "sizzle"
                      ? "shared"
                      : item.mediaType === "video"
                        ? "projects"
                        : "clients"
                  }
                  data-case-object={
                    href && !href.includes("#") ? "" : undefined
                  }
                  data-case-object-key={item.imageUrl}
                  style={
                    {
                      "--object-size": `${size}%`,
                      "--mobile-object-size": `${mobileSize}%`,
                      "--row-offset": `${offset}px`,
                      "--nudge": `${nudge}%`,
                      "--duration": `${4.8 + index * 0.27}s`,
                      "--delay": `${-index * 0.64}s`,
                    } as CSSProperties
                  }
                >
                  <div className={styles.float}>
                    <div className={styles.scroll} data-work-scroll>
                      <div className={styles.pop} data-work-pop>
                        {href ? (
                          <Link
                            className={styles.link}
                            href={href}
                            data-work-collection-link
                            data-case-study-link={
                              !href.includes("#") ? slug : undefined
                            }
                            data-case-accent={study?.accent}
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            className={styles.link}
                            type="button"
                            aria-disabled={comingSoon || undefined}
                            aria-label={
                              comingSoon
                                ? `${item.title}: Coming soon`
                                : `Play ${item.title}`
                            }
                            onClick={() => {
                              if (comingSoon) return;
                              setViewer({
                                title: item.title,
                                mediaType: "video",
                                videoUrl: item.expandedVideoUrl,
                                videoPosterUrl: item.expandedVideoPosterUrl,
                              });
                            }}
                          >
                            {content}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
      <WorkContentViewer content={viewer} onClose={closeViewer} />
    </div>
  );
}
