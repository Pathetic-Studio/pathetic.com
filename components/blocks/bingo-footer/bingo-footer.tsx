"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import LogoAnimated from "@/components/logo-animated";
import {
  useContactModal,
  useNewsletterModal,
} from "@/components/contact/contact-modal-context";
import styles from "./bingo-footer.module.css";

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

// Keep each reveal in an empty square, separate from the link's hit area.
const FOOTER_OBJECTS: Record<string, { src: string; position: number }> = {
  NEWSLETTER: { src: "/images/basket-links/pigeon.png", position: 0 },
  "PRIVACY POLICY": {
    src: "/images/page-loader/yellow-sunglasses.webp",
    position: 5,
  },
  WORK: { src: "/images/what-we-do/sizzle-butter-pan.webp", position: 6 },
  "TALENT MATRIX": {
    src: "/images/network/friends/kael_fangs.webp",
    position: 8,
  },
  INSTA: { src: "/images/network/profile-logo.svg", position: 4 },
  CONTACT: { src: "/images/basket-links/computer.png", position: 5 },
  SHOP: {
    src: "/images/lifecycle/slide-2/pathetic/rhinestone-tee.webp",
    position: 7,
  },
  JOBS: { src: "/images/basket-links/sticker-macbook.webp", position: 10 },
};

function getCellLabel(cell: BingoCell) {
  const configured = stegaClean(cell.label) || "";
  const label = /^careers$/i.test(configured.trim()) ? "JOBS" : configured;
  const normalized = label.trim().replace(/\s+/g, " ").toUpperCase();
  return {
    label,
    normalizedLabel: normalized === "NEWS LETTER" ? "NEWSLETTER" : normalized,
  };
}

function FooterObject({
  src,
  active,
  label,
}: {
  src: string;
  active: boolean;
  label: string;
}) {
  const [ready, setReady] = useState(false);
  return (
    <div
      aria-hidden="true"
      className={styles.object}
      data-bingo-object={label}
      data-active={active}
      data-ready={ready}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="100px"
        className={styles.image}
        draggable={false}
        onLoad={() => setReady(true)}
      />
    </div>
  );
}

const FOOTER_FALLBACKS: Record<
  string,
  { action: "link" | "contact" | "newsletter"; href?: string; target?: boolean }
> = {
  NEWSLETTER: { action: "newsletter" },
  "PRIVACY POLICY": { action: "link", href: "/privacy" },
  WORK: { action: "link", href: "/#work" },
  "TALENT MATRIX": { action: "link", href: "/#talent-matrix" },
  INSTA: {
    action: "link",
    href: "https://www.instagram.com/pathetic/",
    target: true,
  },
  CONTACT: { action: "contact" },
  SHOP: { action: "link", href: "/#basket-links" },
  JOBS: { action: "link", href: "/jobs" },
};

function handleFooterAnchor(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (
    typeof window === "undefined" ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.currentTarget.target === "_blank"
  )
    return;
  const url = new URL(href, window.location.origin);
  if (
    url.origin !== window.location.origin ||
    url.pathname !== window.location.pathname
  ) {
    return;
  }

  const anchorId = decodeURIComponent(url.hash.replace(/^#/, ""));
  if (!anchorId) return;
  event.preventDefault();
  window.dispatchEvent(
    new CustomEvent("app:anchor-navigate", {
      detail: { anchorId, href: `${url.pathname}${url.hash}` },
    }),
  );
}

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
  side,
  activeCell,
  setHoveredCell,
  setFocusedCell,
  openContact,
  openNewsletter,
}: {
  cells: BingoCell[];
  side: "left" | "right";
  activeCell: string | null;
  setHoveredCell: (id: string | null) => void;
  setFocusedCell: (id: string | null) => void;
  openContact: () => void;
  openNewsletter: () => void;
}) {
  const cellsByPosition = new Map(
    cells.map((cell) => [
      `${stegaClean(cell.column) || 1}-${stegaClean(cell.row) || 1}`,
      cell,
    ]),
  );

  const emptyPositions = Array.from({ length: 12 }, (_, index) => index).filter(
    (index) =>
      !cellsByPosition.has(`${(index % 3) + 1}-${Math.floor(index / 3) + 1}`),
  );
  const reveals = cells.flatMap((cell) => {
    const { normalizedLabel } = getCellLabel(cell);
    const object = FOOTER_OBJECTS[normalizedLabel];
    if (!object || !emptyPositions.length) return [];
    return [
      {
        ...object,
        id: `${side}-${cell._key}`,
        label: normalizedLabel,
        position: emptyPositions.includes(object.position)
          ? object.position
          : emptyPositions[0],
      },
    ];
  });

  const clearInteraction = () => {
    setHoveredCell(null);
    setFocusedCell(null);
  };

  const renderCellContent = (cell: BingoCell) => {
    const { label, normalizedLabel } = getCellLabel(cell);
    const id = `${side}-${cell._key}`;
    const fallback = FOOTER_FALLBACKS[normalizedLabel];
    const displayLabel = label.includes("\n")
      ? label
      : REFERENCE_LINE_BREAKS[normalizedLabel] || label;
    const icon = stegaClean(cell.icon) || "none";
    const configuredAction = stegaClean(cell.action) || "link";
    const action =
      configuredAction === "none" && fallback
        ? fallback.action
        : configuredAction;
    const linkType = stegaClean(cell.link?.linkType) || "";
    const configuredHref = stegaClean(cell.link?.href);
    const href =
      normalizedLabel === "JOBS"
        ? "/jobs"
        : normalizedLabel === "WORK" && (configuredHref === "/#work" || configuredHref === "/#what-we-do")
          ? "/#work"
          : configuredHref === "/#shop"
            ? "/#basket-links"
            : configuredHref || fallback?.href || "";
    const opensNewTab = cell.link?.target || fallback?.target;
    const content =
      icon === "star" ? (
        <span
          aria-label={label || "Featured"}
          className="text-[clamp(2.2rem,5vw,4.7rem)] leading-none"
        >
          ★
        </span>
      ) : (
        <span className="max-w-full whitespace-pre-line px-1 text-[clamp(.64rem,1.25vw,1.05rem)] font-bold italic uppercase leading-[.9] tracking-[-.035em]">
          {displayLabel}
        </span>
      );
    const interactionProps = {
      className: styles.control,
      "data-bingo-link": normalizedLabel,
      "data-active": activeCell === id,
      onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") setHoveredCell(id);
      },
      onPointerLeave: () => setHoveredCell(null),
      onPointerCancel: clearInteraction,
      onFocus: (event: React.FocusEvent<HTMLElement>) => {
        if (event.currentTarget.matches(":focus-visible")) setFocusedCell(id);
      },
      onBlur: () => setFocusedCell(null),
    };

    if (action === "contact" || linkType === "contact") {
      return (
        <button
          type="button"
          {...interactionProps}
          onClick={() => {
            clearInteraction();
            openContact();
          }}
        >
          {content}
        </button>
      );
    }
    if (action === "newsletter") {
      return (
        <button
          type="button"
          {...interactionProps}
          onClick={() => {
            clearInteraction();
            openNewsletter();
          }}
        >
          {content}
        </button>
      );
    }
    if (action === "link" && href) {
      return (
        <Link
          href={href}
          scroll={false}
          target={opensNewTab ? "_blank" : undefined}
          rel={opensNewTab ? "noopener noreferrer" : undefined}
          {...interactionProps}
          onClick={(event) => {
            clearInteraction();
            handleFooterAnchor(event, href);
          }}
        >
          {content}
        </Link>
      );
    }
    return (
      <div className="flex h-full w-full items-center justify-center text-center">
        {content}
      </div>
    );
  };

  return (
    <div
      data-bingo-grid={side}
      className="grid aspect-[3/4] w-full grid-cols-3 grid-rows-4 border-l border-t border-current"
    >
      {Array.from({ length: 12 }, (_, index) => {
        const column = (index % 3) + 1;
        const row = Math.floor(index / 3) + 1;
        const cell = cellsByPosition.get(`${column}-${row}`);
        return (
          <div
            key={`${column}-${row}`}
            data-bingo-cell
            className="relative min-h-0 min-w-0 border-b border-r border-current"
          >
            {cell ? renderCellContent(cell) : null}
            {reveals
              .filter((reveal) => reveal.position === index)
              .map((reveal) => (
                <FooterObject
                  key={reveal.id}
                  src={reveal.src}
                  label={reveal.label}
                  active={activeCell === reveal.id}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default function BingoFooter(props: BingoFooterBlock) {
  const { open: openContact } = useContactModal();
  const { open: openNewsletter } = useNewsletterModal();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const activeCell = hoveredCell ?? focusedCell;
  const backgroundColor = stegaClean(props.backgroundColor?.hex) || "#FFFFFF";
  const textColor = stegaClean(props.textColor?.hex) || "#050505";

  return (
    <footer
      data-bingo-footer
      className="relative isolate px-3 py-5 sm:px-5 lg:px-7"
      style={
        {
          backgroundColor,
          color: textColor,
          "--bingo-bg": backgroundColor,
          "--bingo-ink": textColor,
        } as CSSProperties
      }
    >
      <div className="mx-auto grid max-w-[100rem] grid-cols-2 items-center gap-x-0 gap-y-4 lg:grid-cols-[minmax(11rem,1fr)_minmax(0,3.4fr)_minmax(11rem,1fr)] lg:gap-[3vw]">
        <div className="order-2 ml-auto mr-0 w-full max-w-[15rem] lg:order-1 lg:mx-auto lg:max-w-[17rem]">
          <BingoGrid
            cells={props.leftCells ?? []}
            side="left"
            activeCell={activeCell}
            setHoveredCell={setHoveredCell}
            setFocusedCell={setFocusedCell}
            openContact={openContact}
            openNewsletter={openNewsletter}
          />
        </div>

        <div data-abyss-piece className="order-1 col-span-2 flex min-h-[clamp(8rem,25vw,19rem)] items-center justify-center lg:order-2 lg:col-span-1">
          <LogoAnimated className="h-full max-h-[19rem] w-full text-current" />
        </div>

        <div className="order-3 ml-0 mr-auto w-full max-w-[15rem] max-lg:[&>div]:border-l-0 lg:mx-auto lg:max-w-[17rem]">
          <BingoGrid
            cells={props.rightCells ?? []}
            side="right"
            activeCell={activeCell}
            setHoveredCell={setHoveredCell}
            setFocusedCell={setFocusedCell}
            openContact={openContact}
            openNewsletter={openNewsletter}
          />
        </div>
      </div>
    </footer>
  );
}
