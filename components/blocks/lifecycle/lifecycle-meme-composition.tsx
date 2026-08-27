"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export type MemeLayerSpec = {
  src?: string;
  alt: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

type MemeCopySpec = {
  text: string;
  left: number;
  top: number;
  width: number;
  kind: "headline" | "caption";
  italic?: boolean;
  fontSize?: string;
};

type MemeLineSpec = {
  left: number;
  top: number;
  width: number;
};

export type MemeTemplate = {
  label: string;
  aspectRatio: number;
  layers: MemeLayerSpec[];
  copies: MemeCopySpec[];
  lines: MemeLineSpec[];
};

export type MemeCompositionTarget = {
  groupIndex: number;
  layerIndex: number;
  globalIndex: number;
  x: number;
  y: number;
};

export type MemeCompositionBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const ASSET_ROOT = "/images/lifecycle/memes";

export const MEME_TEMPLATES: MemeTemplate[] = [
  {
    label: "Grooming routine starter pack",
    aspectRatio: 2198 / 2484,
    copies: [
      {
        text: "guy who spends his time doing nothing in particular yet maintains an absurdly expensive grooming routine starter pack",
        left: 8,
        top: 4,
        width: 84,
        kind: "headline",
        italic: true,
        fontSize: "clamp(8px,0.78vw,12px)",
      },
      {
        text: "knows everyone at the brushed concrete third space coffee lab",
        left: 2,
        top: 66,
        width: 29,
        kind: "caption",
      },
    ],
    lines: [],
    layers: [
      { src: `${ASSET_ROOT}/grooming-person.webp`, alt: "Man wearing sunglasses", left: 25.745, top: 31.696, width: 52.146, height: 51.541 },
      { src: `${ASSET_ROOT}/grooming-shoes.webp`, alt: "Silver shoes", left: 8.363, top: 23.927, width: 15.759, height: 18.397 },
      { src: `${ASSET_ROOT}/grooming-local-guy.webp`, alt: "Man in blue shirt", left: 64.273, top: 16.197, width: 28.543, height: 38.887 },
      { src: `${ASSET_ROOT}/grooming-cafe.webp`, alt: "Coffee shop", left: 3.2, top: 44.917, width: 27.606, height: 19.687 },
      { src: `${ASSET_ROOT}/grooming-jacket.webp`, alt: "Track jacket", left: 77.444, top: 75.633, width: 19.475, height: 22.203 },
      { src: `${ASSET_ROOT}/grooming-laptop.webp`, alt: "Laptop", left: 24.123, top: 85.475, width: 24.959, height: 12.364 },
      { src: `${ASSET_ROOT}/grooming-pants.webp`, alt: "Cream trousers", left: 75.614, top: 46.892, width: 23.501, height: 31.192 },
      { src: `${ASSET_ROOT}/grooming-hand.webp`, alt: "Hand wearing rings", left: 52.443, top: 77.232, width: 20.387, height: 21.992 },
      { src: `${ASSET_ROOT}/grooming-aesop.webp`, alt: "Aesop bottle", left: 31.415, top: 25.362, width: 13.617, height: 12.049 },
      { src: `${ASSET_ROOT}/grooming-perfume.webp`, alt: "Perfume bottle", left: 65.911, top: 58.849, width: 10.404, height: 11.507 },
      { src: `${ASSET_ROOT}/grooming-hoodie.webp`, alt: "Grey hoodie", left: 2.396, top: 75.415, width: 21.729, height: 20.133 },
      { src: `${ASSET_ROOT}/grooming-can.webp`, alt: "Sparkling tea", left: 85.362, top: 34.343, width: 12.456, height: 14.696 },
      { src: `${ASSET_ROOT}/grooming-player.webp`, alt: "Music player", left: 54.854, top: 23.295, width: 13.289, height: 11.759 },
    ],
  },
  {
    label: "Pants width home coffee index",
    aspectRatio: 1699 / 1891,
    copies: [
      {
        text: "pants width home coffee index",
        left: 5,
        top: 7,
        width: 90,
        kind: "headline",
      },
    ],
    // This divider deliberately sits below the full trouser silhouettes and
    // above the coffee row, so no pair of pants is cut through by the index.
    lines: [{ left: 4.5, top: 62.35, width: 91 }],
    layers: [
      { src: `${ASSET_ROOT}/pants-skinny.webp`, alt: "Slim black trousers", left: 1.577, top: 21.943, width: 17.072, height: 39.596 },
      { src: `${ASSET_ROOT}/pants-denim.webp`, alt: "Wide denim trousers", left: 24.894, top: 21.943, width: 19.057, height: 39.596 },
      { src: `${ASSET_ROOT}/pants-wide-black.webp`, alt: "Wide black trousers", left: 46.233, top: 21.943, width: 22.946, height: 38.229 },
      { src: `${ASSET_ROOT}/pants-grey.webp`, alt: "Wide grey trousers", left: 69.179, top: 22.544, width: 30.821, height: 40.166 },
      { src: `${ASSET_ROOT}/coffee-instant.webp`, alt: "Instant coffee", left: 1.577, top: 67.66, width: 15.587, height: 21.312 },
      { src: `${ASSET_ROOT}/coffee-mug.webp`, alt: "White mug", left: 8.969, top: 78.331, width: 10.422, height: 9.364 },
      { src: `${ASSET_ROOT}/coffee-moka.webp`, alt: "Moka pot", left: 14.195, top: 67.66, width: 35.96, height: 21.539 },
      { src: `${ASSET_ROOT}/coffee-brick.webp`, alt: "Coffee brick", left: 23.659, top: 78.997, width: 26.513, height: 12.472 },
      { src: `${ASSET_ROOT}/coffee-cup.webp`, alt: "Coffee cup", left: 23.412, top: 81.304, width: 8.783, height: 7.891 },
      { src: `${ASSET_ROOT}/coffee-machine.webp`, alt: "Coffee machine", left: 71.75, top: 64.076, width: 26.906, height: 25.703 },
      { src: `${ASSET_ROOT}/coffee-pourover.webp`, alt: "Pour-over coffee set", left: 43.112, top: 64.076, width: 29.195, height: 26.231 },
      { src: `${ASSET_ROOT}/coffee-speckled-cup.webp`, alt: "Speckled coffee cup", left: 88.234, top: 81.304, width: 8.694, height: 6.388 },
    ],
  },
  {
    label: "Performative reformative",
    aspectRatio: 1949 / 2203,
    copies: [
      { text: "performative", left: 26, top: 3.8, width: 48, kind: "headline", italic: true },
      { text: "reformative", left: 27, top: 52.8, width: 46, kind: "headline", italic: true },
    ],
    lines: [],
    layers: [
      { src: `${ASSET_ROOT}/reformative-matcha.webp`, alt: "Iced matcha", left: 3.194, top: 54.49, width: 10.932, height: 15.072 },
      { src: `${ASSET_ROOT}/performative-cap.webp`, alt: "Knicks cap", left: 2.515, top: 18.357, width: 15.197, height: 13.445 },
      { src: `${ASSET_ROOT}/performative-player.webp`, alt: "Wrapped music player", left: 65.283, top: 21.609, width: 15.48, height: 13.695 },
      { src: `${ASSET_ROOT}/performative-boots.webp`, alt: "Brown boots", left: 0.134, top: 35.923, width: 19.964, height: 16.312 },
      { src: `${ASSET_ROOT}/performative-sunglasses.webp`, alt: "Gold sunglasses", left: 17.891, top: 35.304, width: 14.884, height: 17.553 },
      { src: `${ASSET_ROOT}/performative-oysters.webp`, alt: "Oyster platter", left: 79.795, top: 17.277, width: 16.955, height: 20 },
      { src: `${ASSET_ROOT}/performative-jersey.webp`, alt: "Colombia jersey", left: 13.396, top: 8.048, width: 16.745, height: 14.814 },
      { src: `${ASSET_ROOT}/performative-martini.webp`, alt: "Martini tray", left: 78.832, top: 4.148, width: 20.081, height: 13.088 },
      { src: `${ASSET_ROOT}/performative-flats.webp`, alt: "Black ballet flats", left: 60.088, top: 12.181, width: 17.861, height: 8.889 },
      { src: `${ASSET_ROOT}/performative-bag.webp`, alt: "Black handbag", left: 17.891, top: 22.807, width: 17.861, height: 15.802 },
      { src: `${ASSET_ROOT}/performative-person.webp`, alt: "Performative person", left: 32.671, top: 12.181, width: 39.935, height: 39.215 },
      { src: `${ASSET_ROOT}/reformative-ginger.webp`, alt: "Ginger shot", left: 68.32, top: 71.879, width: 5.632, height: 9.315 },
      { src: `${ASSET_ROOT}/reformative-soup.webp`, alt: "Soup bowl", left: 4.435, top: 83.026, width: 22.386, height: 14.854 },
      { src: `${ASSET_ROOT}/reformative-cetaphil.webp`, alt: "Cetaphil lotion", left: 24.961, top: 58.783, width: 15.048, height: 13.313 },
      { src: `${ASSET_ROOT}/reformative-yoga.webp`, alt: "Yoga pose", left: 11.893, top: 68.106, width: 14.931, height: 15.905 },
      { src: `${ASSET_ROOT}/reformative-reformer.webp`, alt: "Pilates reformer", left: 69.019, top: 53.608, width: 22.236, height: 13.854 },
      { src: `${ASSET_ROOT}/reformative-person.webp`, alt: "Reformative person", left: 28.295, top: 57.717, width: 49.651, height: 41.312 },
      { src: `${ASSET_ROOT}/reformative-shoe.webp`, alt: "Black running shoe", left: 76.327, top: 84.712, width: 20.512, height: 14.023 },
      { src: `${ASSET_ROOT}/performative-guinness.webp`, alt: "Guinness pint", left: 87.848, top: 37.082, width: 8.898, height: 13.99 },
      { src: `${ASSET_ROOT}/performative-trail-shoe.webp`, alt: "Trail running shoe", left: 70.493, top: 27.825, width: 15.899, height: 21.092 },
      { src: `${ASSET_ROOT}/reformative-eye-patches.webp`, alt: "Gold eye patches", left: 80.763, top: 67.461, width: 11.538, height: 11.612 },
      { src: `${ASSET_ROOT}/reformative-tub.webp`, alt: "Wooden plunge tub", left: 79.617, top: 75.665, width: 16.447, height: 14.551 },
    ],
  },
];

function TypedCopy({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((token, tokenIndex) =>
        /^\s+$/.test(token) ? (
          token
        ) : (
          <span key={`${token}-${tokenIndex}`} className="inline-block">
            {Array.from(token).map((character, characterIndex) => (
              <span
                key={`${character}-${characterIndex}`}
                data-meme-copy-char
                className="inline-block"
              >
                {character}
              </span>
            ))}
          </span>
        ),
      )}
    </>
  );
}

type LifecycleMemeCompositionProps = {
  template: MemeTemplate;
  box: MemeCompositionBox;
  active: boolean;
  onExitComplete: () => void;
};

export default function LifecycleMemeComposition({
  template,
  box,
  active,
  onExitComplete,
}: LifecycleMemeCompositionProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onExitCompleteRef = useRef(onExitComplete);
  onExitCompleteRef.current = onExitComplete;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const chars = gsap.utils.toArray<HTMLElement>(
        "[data-meme-copy-char]",
        root,
      );
      const lines = gsap.utils.toArray<HTMLElement>("[data-meme-line]", root);
      const frameEdges = gsap.utils.toArray<HTMLElement>(
        "[data-meme-frame-edge]",
        root,
      );

      gsap.set(lines, { transformOrigin: "left center" });
      frameEdges.forEach((edge) => {
        gsap.set(edge, {
          transformOrigin: edge.dataset.frameOrigin,
        });
      });

      if (active) {
        gsap.set(root, { autoAlpha: 1 });
        gsap.set(chars, { autoAlpha: 0 });
        gsap.set(lines, { scaleX: 0 });
        gsap.set(frameEdges, { scaleX: 1, scaleY: 1 });
        frameEdges.forEach((edge) => {
          gsap.set(edge, {
            [edge.dataset.frameAxis === "y" ? "scaleY" : "scaleX"]: 0,
          });
        });

        const timeline = gsap.timeline();
        frameEdges.forEach((edge, index) => {
          timeline.to(
            edge,
            {
              [edge.dataset.frameAxis === "y" ? "scaleY" : "scaleX"]: 1,
              duration: 0.22,
              ease: "power2.inOut",
            },
            index * 0.11,
          );
        });

        timeline
          .to(
            lines,
            {
              scaleX: 1,
              duration: 0.4,
              stagger: 0.08,
              ease: "power3.inOut",
            },
            0.12,
          )
          .to(
            chars,
            {
              autoAlpha: 1,
              duration: 0.01,
              stagger:
                chars.length > 1 ? Math.min(0.012, 0.72 / chars.length) : 0,
              ease: "none",
            },
            0.2,
          );
      } else {
        gsap.set(root, { autoAlpha: 1 });
        gsap.set(chars, { autoAlpha: 1 });
        gsap.set(lines, { scaleX: 1 });
        gsap.set(frameEdges, { scaleX: 1, scaleY: 1 });

        const timeline = gsap.timeline({
          onComplete: () => onExitCompleteRef.current(),
        });

        timeline
          .to(chars, {
            autoAlpha: 0,
            duration: 0.01,
            stagger: {
              each:
                chars.length > 1 ? Math.min(0.006, 0.3 / chars.length) : 0,
              from: "end",
            },
            ease: "none",
          })
          .to(lines, { scaleX: 0, duration: 0.3, ease: "power2.inOut" }, 0);

        [...frameEdges].reverse().forEach((edge, index) => {
          timeline.to(
            edge,
            {
              [edge.dataset.frameAxis === "y" ? "scaleY" : "scaleX"]: 0,
              duration: 0.24,
              ease: "power2.inOut",
            },
            index * 0.09,
          );
        });

        timeline.to(root, { autoAlpha: 0, duration: 0.08 }, 0.52);
      }
    }, root);

    return () => context.revert();
  }, [active, template]);

  return (
    <div
      ref={rootRef}
      data-lifecycle-meme-composition
      className="pointer-events-none absolute z-[130] text-foreground"
      style={{
        left: `${box.left}%`,
        top: `${box.top}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
      aria-hidden="true"
    >
      <div
        data-meme-frame
        className="absolute -inset-px"
      >
        <span
          data-meme-frame-edge
          data-frame-axis="x"
          data-frame-origin="left center"
          className="absolute left-0 top-0 h-px w-full bg-current"
        />
        <span
          data-meme-frame-edge
          data-frame-axis="y"
          data-frame-origin="center top"
          className="absolute right-0 top-0 h-full w-px bg-current"
        />
        <span
          data-meme-frame-edge
          data-frame-axis="x"
          data-frame-origin="right center"
          className="absolute bottom-0 left-0 h-px w-full bg-current"
        />
        <span
          data-meme-frame-edge
          data-frame-axis="y"
          data-frame-origin="center bottom"
          className="absolute left-0 top-0 h-full w-px bg-current"
        />
      </div>

      {template.lines.map((line, index) => (
        <div
          key={`line-${index}`}
          data-meme-line
          className="absolute h-[2px] bg-current"
          style={{
            left: `${line.left}%`,
            top: `${line.top}%`,
            width: `${line.width}%`,
          }}
        />
      ))}

      {template.copies.map((copy, index) => (
        <div
          key={`${copy.text}-${index}`}
          className={`${
            copy.kind === "headline"
              ? "absolute text-center text-[clamp(9px,1vw,17px)] font-bold uppercase leading-[1.02]"
              : "absolute text-center text-[clamp(6px,0.5vw,9px)] font-bold leading-[1.05]"
          } ${copy.italic ? "italic" : ""}`}
          style={{
            left: `${copy.left}%`,
            top: `${copy.top}%`,
            width: `${copy.width}%`,
            fontSize: copy.fontSize,
          }}
        >
          <TypedCopy text={copy.text} />
        </div>
      ))}
    </div>
  );
}
