"use client";

import { useRef, type MutableRefObject } from "react";
import { stegaClean } from "next-sanity";
import type { PAGE_QUERYResult } from "@/sanity.types";
import { Button } from "@/components/ui/button";
import TitleText from "@/components/ui/title-text";
import { SECTION_HEADER_BODY_CLASS } from "@/components/ui/text-styles";
import { splitTextAtWordRatio } from "@/components/blocks/shared/text-lines";
import TalentMatrixScene from "./talent-matrix-scene";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
export type TalentMatrixBlock = Extract<
  PageBlock,
  { _type: "talent-matrix-section" }
>;

function colorValue(
  color: { hex?: string | null } | null | undefined,
  fallback: string,
) {
  return stegaClean(color?.hex) || fallback;
}

export function TalentMatrixView({
  block,
  className = "",
  cameraScrollProgress,
  quality = "desktop",
}: {
  block: TalentMatrixBlock;
  className?: string;
  cameraScrollProgress?: MutableRefObject<{ value: number }>;
  quality?: "desktop" | "tablet" | "mobile";
}) {
  const highlightAllBuildings = useRef({ value: false });
  const sceneColor = colorValue(block.sceneColor, "#00ff46");
  const backgroundColor = colorValue(block.backgroundColor, "#000600");
  const density = Math.max(12, Math.min(54, stegaClean(block.cityDensity) || 30));
  const talents = (block.talents || []).slice(0, 6);
  const cleanTitle = (stegaClean(block.title) || "TALENT\nMATRIX").trim();
  const explicitTitleLines = cleanTitle
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const titleWords = cleanTitle.split(/\s+/).filter(Boolean);
  const talentLine =
    explicitTitleLines.length > 1
      ? explicitTitleLines[0]
      : titleWords.slice(0, -1).join(" ") || titleWords[0] || "TALENT";
  const matrixLine =
    explicitTitleLines.length > 1
      ? explicitTitleLines.slice(1).join(" ")
      : titleWords.at(-1) || "MATRIX";
  const cleanDescription = stegaClean(block.description) || "";
  const descriptionLines = splitTextAtWordRatio(cleanDescription, 0.57);

  return (
    <div
      className={`relative h-full min-h-[100svh] overflow-hidden text-white ${className}`}
      style={{ backgroundColor }}
    >
      <TalentMatrixScene
        color={sceneColor}
        density={density}
        cameraScrollProgress={cameraScrollProgress}
        highlightAllBuildings={highlightAllBuildings}
        avatarCount={Math.min(talents.length, 4)}
        avatarLabels={talents
          .slice(0, 4)
          .map((talent) => stegaClean(talent.label) || "")}
        quality={quality}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,12,3,.06)_38%,rgba(0,4,1,.42)_100%),linear-gradient(180deg,rgba(0,0,0,.06),transparent_50%,rgba(0,0,0,.2))]" />

      <div data-talent-copy className="pointer-events-none absolute inset-x-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center text-center sm:inset-x-4">
        {block.eyebrow && (
          <TitleText
            variant="stretched"
            as="p"
            size="matrix-eyebrow"
            maxChars={24}
            animation="none"
            fontWeight="bold"
            textColor="#ffffff"
            stretchScaleX={0.66}
            className="pointer-events-auto !w-auto select-text [&_p]:leading-none [&_p]:tracking-[-.035em]"
          >
            {stegaClean(block.eyebrow)}
          </TitleText>
        )}
        {block.accentWord && (
          <TitleText
            variant="stretched"
            as="p"
            size="matrix-accent"
            maxChars={12}
            animation="none"
            fontWeight="bold"
            textColor="#ffffff"
            stretchScaleX={0.66}
            overallScale={1.2}
            className="pointer-events-auto !mt-[2.4rem] !w-auto select-text sm:!mt-[3.25rem] lg:!mt-[4.25rem] [&_p]:leading-[.8] [&_p]:tracking-[-.045em]"
          >
            {stegaClean(block.accentWord)}
          </TitleText>
        )}
        <div className="pointer-events-auto mt-2 flex select-text flex-col items-center" aria-label={cleanTitle.replace(/\n+/g, " ")}>
          <TitleText
            variant="stretched"
            as="h2"
            size="matrix-talent"
            maxChars={12}
            animation="none"
            fontWeight="bold"
            textColor="#ffffff"
            stretchScaleX={0.66}
            overallScale={1.3}
            className="!w-auto [&_h2]:leading-[.78] [&_h2]:tracking-[-.045em]"
          >
            {talentLine}
          </TitleText>
          <TitleText
            variant="stretched"
            as="p"
            size="matrix-matrix"
            maxChars={12}
            animation="none"
            fontWeight="bold"
            textColor="#ffffff"
            stretchScaleX={0.66}
            overallScale={1.38}
            className="!mt-4 !w-auto [&_p]:leading-[.76] [&_p]:tracking-[-.04em]"
          >
            {matrixLine}
          </TitleText>
        </div>
        {cleanDescription && (
          <p className={`pointer-events-auto mt-4 select-text text-white sm:mt-5 lg:mt-6 [text-shadow:0_2px_8px_#000] ${SECTION_HEADER_BODY_CLASS}`}>
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
        {block.cta?.title && (
          <div
            data-matrix-submit-hover="true"
            className="pointer-events-auto mt-5"
            onMouseEnter={() => {
              highlightAllBuildings.current.value = true;
            }}
            onMouseLeave={() => {
              highlightAllBuildings.current.value = false;
            }}
          >
            <Button
              link={block.cta as any}
              size="lg"
              className="border border-white bg-white text-sm font-semibold uppercase text-black hover:bg-black hover:text-white"
            >
              {stegaClean(block.cta.title)}
            </Button>
          </div>
        )}
      </div>

      {!!talents.length && (
        <div data-talent-roles className="sr-only">
          {talents.slice(0, 4).map((talent, index) => (
            <span key={talent._key || index}>{stegaClean(talent.label)}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TalentMatrixSection(block: TalentMatrixBlock) {
  const id = stegaClean(block.anchor?.anchorId) || "talent-matrix";

  return (
    <section id={id} className="relative min-h-[100svh] overflow-hidden">
      <TalentMatrixView block={block} />
    </section>
  );
}
