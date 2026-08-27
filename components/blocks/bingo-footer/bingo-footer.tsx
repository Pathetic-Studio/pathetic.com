"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import LogoAnimated from "@/components/logo-animated";
import { useContactModal, useNewsletterModal } from "@/components/contact/contact-modal-context";

type BingoLink = {
  linkType?: string | null;
  href?: string | null;
  target?: boolean | null;
};

type BingoCell = {
  _key: string;
  label?: string | null;
  icon?: string | null;
  action?: string | null;
  column?: number | null;
  row?: number | null;
  link?: BingoLink | null;
};

const REFERENCE_LINE_BREAKS: Record<string, string> = {
  NEWSLETTER: "NEWS\nLETTER",
  "PRIVACY POLICY": "PRIVACY\nPOLICY",
  "TALENT MATRIX": "TALENT\nMATRIX",
};

export type BingoFooterBlock = {
  _type: "bingo-footer";
  _key: string;
  backgroundColor?: { hex?: string | null } | null;
  textColor?: { hex?: string | null } | null;
  leftCells?: BingoCell[] | null;
  rightCells?: BingoCell[] | null;
};

function BingoGrid({
  cells,
  openContact,
  openNewsletter,
}: {
  cells: BingoCell[];
  openContact: () => void;
  openNewsletter: () => void;
}) {
  const cellsByPosition = new Map(
    cells.map((cell) => [`${stegaClean(cell.column) || 1}-${stegaClean(cell.row) || 1}`, cell]),
  );

  const renderCellContent = (cell: BingoCell) => {
    const label = stegaClean(cell.label) || "";
    const displayLabel = label.includes("\n")
      ? label
      : REFERENCE_LINE_BREAKS[label.trim().replace(/\s+/g, " ").toUpperCase()] || label;
    const icon = stegaClean(cell.icon) || "none";
    const action = stegaClean(cell.action) || "link";
    const linkType = stegaClean(cell.link?.linkType) || "";
    const href = stegaClean(cell.link?.href) || "";
    const content = icon === "star" ? (
      <span aria-label={label || "Featured"} className="text-[clamp(2.2rem,5vw,4.7rem)] leading-none">★</span>
    ) : (
      <span className="max-w-full whitespace-pre-line px-1 text-[clamp(.64rem,1.25vw,1.05rem)] font-bold italic uppercase leading-[.9] tracking-[-.035em]">
        {displayLabel}
      </span>
    );
    const className = "flex h-full w-full items-center justify-center text-center transition-colors duration-150 hover:bg-[var(--bingo-ink)] hover:text-[var(--bingo-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px]";

    if (action === "contact" || linkType === "contact") {
      return <button type="button" onClick={openContact} className={className}>{content}</button>;
    }
    if (action === "newsletter") {
      return <button type="button" onClick={openNewsletter} className={className}>{content}</button>;
    }
    if (action === "link" && href) {
      return (
        <Link href={href} target={cell.link?.target ? "_blank" : undefined} rel={cell.link?.target ? "noopener noreferrer" : undefined} className={className}>
          {content}
        </Link>
      );
    }
    return <div className="flex h-full w-full items-center justify-center text-center">{content}</div>;
  };

  return (
    <div className="grid aspect-[3/4] w-full grid-cols-3 grid-rows-4 border-l border-t border-current">
      {Array.from({ length: 12 }, (_, index) => {
        const column = (index % 3) + 1;
        const row = Math.floor(index / 3) + 1;
        const cell = cellsByPosition.get(`${column}-${row}`);
        return (
          <div key={`${column}-${row}`} data-bingo-cell className="min-h-0 min-w-0 border-b border-r border-current">
            {cell ? renderCellContent(cell) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function BingoFooter(props: BingoFooterBlock) {
  const { open: openContact } = useContactModal();
  const { open: openNewsletter } = useNewsletterModal();
  const backgroundColor = stegaClean(props.backgroundColor?.hex) || "#FFFFFF";
  const textColor = stegaClean(props.textColor?.hex) || "#050505";

  return (
    <footer
      className="relative isolate px-3 py-5 sm:px-5 lg:px-7"
      style={{ backgroundColor, color: textColor, "--bingo-bg": backgroundColor, "--bingo-ink": textColor } as CSSProperties}
    >
      <div className="mx-auto grid max-w-[100rem] grid-cols-2 items-center gap-4 lg:grid-cols-[minmax(11rem,1fr)_minmax(0,3.4fr)_minmax(11rem,1fr)] lg:gap-[3vw]">
        <div className="order-2 mx-auto w-full max-w-[15rem] lg:order-1 lg:max-w-[17rem]">
          <BingoGrid cells={props.leftCells ?? []} openContact={openContact} openNewsletter={openNewsletter} />
        </div>

        <div className="order-1 col-span-2 flex min-h-[clamp(8rem,25vw,19rem)] items-center justify-center lg:order-2 lg:col-span-1">
          <LogoAnimated className="h-full max-h-[19rem] w-full text-current" />
        </div>

        <div className="order-3 mx-auto w-full max-w-[15rem] lg:max-w-[17rem]">
          <BingoGrid cells={props.rightCells ?? []} openContact={openContact} openNewsletter={openNewsletter} />
        </div>
      </div>
    </footer>
  );
}
