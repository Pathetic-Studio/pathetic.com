/**
 * The site's semantic text system.
 *
 * Display headings remain in TitleText because their stretched, scene-specific
 * geometry is part of the art direction. Everything below display level uses
 * this restrained 10 / 12 / 14 / 16 / 18 / 20 / 24 / 32px scale.
 */
export const TEXT_STYLES = {
  eyebrow:
    "text-sm font-semibold uppercase leading-none tracking-[-.02em] sm:text-base",
  sectionBody:
    "text-lg font-medium leading-[1.08] tracking-[-.025em] sm:text-xl",
  bodyLarge: "text-lg leading-[1.2] tracking-[-.015em] sm:text-xl",
  body: "text-base leading-[1.22] tracking-[-.01em] sm:text-lg",
  bodyCompact: "text-sm leading-[1.2] tracking-[-.01em] sm:text-base",
  cardTitle:
    "text-xl font-bold uppercase leading-[.98] tracking-[-.03em] sm:text-2xl",
  subheading:
    "text-2xl font-bold uppercase leading-[.95] tracking-[-.035em] sm:text-[2rem]",
  dataTitle:
    "text-base font-bold uppercase leading-[.9] tracking-[-.03em] sm:text-lg lg:text-xl",
  dataValue:
    "text-sm font-medium uppercase leading-[1.02] tracking-[-.02em] sm:text-base lg:text-lg",
  label:
    "text-xs font-semibold uppercase leading-none tracking-[-.015em] sm:text-sm",
  link:
    "text-sm font-semibold uppercase leading-none tracking-[-.02em] sm:text-base",
  nav: "text-sm font-semibold uppercase leading-none tracking-[-.015em]",
  caption: "text-xs leading-[1.18] tracking-[.015em] sm:text-sm",
  micro:
    "text-[.625rem] font-semibold uppercase leading-none tracking-[.08em] sm:text-xs",
} as const;

export type TextStyleRole = keyof typeof TEXT_STYLES;

export const TEXT_WIDTHS = {
  sectionBody:
    "w-[min(86vw,36rem)] max-w-[36rem] sm:w-[min(84vw,36rem)]",
  body: "w-[min(88vw,42rem)] max-w-[42rem] sm:w-[min(84vw,42rem)]",
  bodyCompact: "w-[min(84vw,32rem)] max-w-[32rem]",
} as const;

export const DISPLAY_OUTLINE_WIDTH = 1.5;
export const DISPLAY_OUTLINE_WIDTHS = {
  standard: 1.5,
  large: 2,
  monumental: 2.5,
  heavy: 3,
} as const;
export const DISPLAY_OUTLINE_POSITION = "outside" as const;

// Backwards-compatible names used by the feature sections.
export const SECTION_HEADER_BODY_TYPE_CLASS = TEXT_STYLES.sectionBody;
export const SECTION_HEADER_BODY_WIDTH_CLASS = TEXT_WIDTHS.sectionBody;
export const SECTION_HEADER_BODY_CLASS = `${SECTION_HEADER_BODY_WIDTH_CLASS} ${SECTION_HEADER_BODY_TYPE_CLASS}`;
