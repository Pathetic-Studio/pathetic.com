import {
  CASH_APP_OBJECT,
  SQUARE_OBJECT,
  WORK_TITLE_CARDS,
} from "./work-assets";

export type ResolvedFloatingProject = {
  _key: string;
  title: string;
  href: string | null;
  target?: boolean | null;
  interactionMode: "link" | "reveal" | "fullscreen";
  revealTitle?: string;
  revealDescription?: string;
  expandedMediaType?: "image" | "video";
  expandedImageUrl?: string;
  expandedImageAlt?: string;
  expandedVideoUrl?: string;
  expandedVideoPosterUrl?: string;
  caseStudyHref?: string;
  mediaType: "image" | "video";
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  titleCardUrl?: string;
  previewScale?: number;
  mediaFit: "contain" | "cover";
  positionX?: number | null;
  positionY?: number | null;
  width?: number | null;
  mobilePositionX?: number | null;
  mobilePositionY?: number | null;
  mobileWidth?: number | null;
  floatAmount?: number | null;
  floatDuration?: number | null;
  aspectRatio?: "landscape" | "portrait";
};

// Tight artwork bounds keep labels beside the object while preserving its size.
export const WORK_MEDIA_FRAMES: Record<
  string,
  { src?: string; ratio: number; width: number }
> = {
  whatWeDoDoorDash: { src: "doordash", ratio: 599 / 935, width: 599 / 800 },
  whatWeDoAdidas: { src: "adidas", ratio: 304 / 137, width: 304 / 329 },
  "local-sandbar": {
    src: "sandbar",
    ratio: 990 / 1070,
    width: (0.75 * 990) / 1254,
  },
  "local-square": {
    src: "square",
    ratio: 1030 / 1098,
    width: (0.75 * 1030) / 1254,
  },
  "local-cash-app": {
    src: "cash-app",
    ratio: 724 / 1131,
    width: (0.75 * 724) / 1254,
  },
  "local-bless-this-desk": { ratio: 9 / (16 * 0.72), width: 1 },
};

export const LOCAL_FLOATING_PROJECTS: ResolvedFloatingProject[] = [
  {
    _key: "local-sandbar",
    title: "SANDBAR",
    href: "/work/stream-by-sandbar",
    interactionMode: "link",
    mediaType: "image",
    imageUrl: "/images/case-studies/objects/stream-ring-hires.webp",
    imageAlt: "Sandbar smart ring",
    mediaFit: "contain",
    positionX: 57,
    positionY: 46,
    width: 14,
    mobilePositionX: 71,
    mobilePositionY: 31,
    mobileWidth: 25,
    floatAmount: 9,
    floatDuration: 5.8,
  },
  {
    _key: "local-yom",
    title: "YOU’RE ON MUTE",
    href: null,
    interactionMode: "fullscreen",
    mediaType: "video",
    videoUrl: "/media/work/yom-preview.mp4",
    titleCardUrl: WORK_TITLE_CARDS["youre-on-mute"],
    videoPosterUrl: "/media/case-studies/deel/yom-poster.webp",
    expandedMediaType: "video",
    expandedVideoUrl: "/media/case-studies/deel/yom.mp4",
    caseStudyHref: "/work/deel#youre-on-mute",
    mediaFit: "cover",
    positionX: 85,
    positionY: 64,
    width: 8.5,
    mobilePositionX: 28,
    mobilePositionY: 66,
    mobileWidth: 24,
    floatAmount: 7,
    floatDuration: 6.4,
    aspectRatio: "portrait",
  },
  {
    _key: "local-bless-this-desk",
    title: "BLESS THIS DESK",
    href: null,
    interactionMode: "fullscreen",
    mediaType: "video",
    videoUrl: "/media/work/bless-this-desk-preview.mp4",
    titleCardUrl: "/images/what-we-do/trimmed/bless-this-desk.webp",
    previewScale: 0.72,
    videoPosterUrl: "/media/case-studies/deel/bless-this-desk-poster.webp",
    expandedMediaType: "video",
    expandedVideoUrl: "/media/case-studies/deel/bless-this-desk.mp4",
    caseStudyHref: "/work/deel#bless-this-desk",
    mediaFit: "cover",
    positionX: 18,
    positionY: 37,
    width: 13,
    mobilePositionX: 73,
    mobilePositionY: 42,
    mobileWidth: 23,
    floatAmount: 8,
    floatDuration: 5.7,
    aspectRatio: "portrait",
  },
  {
    _key: "local-square",
    title: "SQUARE",
    href: "/work/square-cash-app",
    interactionMode: "link",
    mediaType: "image",
    imageUrl: SQUARE_OBJECT.src,
    imageAlt: SQUARE_OBJECT.alt,
    mediaFit: "contain",
    positionX: 29,
    positionY: 72,
    width: 16.5,
    floatAmount: 8,
    floatDuration: 5.9,
  },
  {
    _key: "local-cash-app",
    title: "CASH APP",
    href: "/work/square-cash-app",
    interactionMode: "link",
    mediaType: "image",
    imageUrl: CASH_APP_OBJECT.src,
    imageAlt: CASH_APP_OBJECT.alt,
    mediaFit: "contain",
    positionX: 70,
    positionY: 72,
    width: 15,
    floatAmount: 9,
    floatDuration: 6.3,
  },
];

/** The collection adds Air to all of the homepage work artwork. */
export const WORK_COLLECTION: ResolvedFloatingProject[] = [
  {
    _key: "whatWeDoRamp",
    title: "RAMP",
    href: "/work/ramp",
    interactionMode: "link",
    mediaType: "image",
    imageUrl: "/media/case-studies/ramp/card.webp",
    mediaFit: "contain",
  },
  LOCAL_FLOATING_PROJECTS[1],
  {
    _key: "whatWeDoAdidas",
    title: "ADIDAS",
    href: null,
    interactionMode: "link",
    mediaType: "image",
    imageUrl: "/images/what-we-do/trimmed/adidas.webp",
    mediaFit: "contain",
  },
  LOCAL_FLOATING_PROJECTS[0],
  {
    _key: "whatWeDoDoorDash",
    title: "DOORDASH",
    href: null,
    interactionMode: "link",
    mediaType: "image",
    imageUrl: "/images/what-we-do/trimmed/doordash.webp",
    mediaFit: "contain",
  },
  LOCAL_FLOATING_PROJECTS[2],
  LOCAL_FLOATING_PROJECTS[3],
  LOCAL_FLOATING_PROJECTS[4],
  {
    _key: "sizzle",
    title: "SIZZLE REEL",
    href: null,
    interactionMode: "fullscreen",
    mediaType: "image",
    imageUrl: "/images/what-we-do/sizzle-butter-pan.webp",
    mediaFit: "contain",
    expandedVideoUrl: "/media/work/sizzle.mp4",
    expandedVideoPosterUrl: "/media/work/sizzle-poster.webp",
  },
  {
    _key: "air",
    title: "AIR",
    href: "/work/air",
    interactionMode: "link",
    mediaType: "image",
    imageUrl: "/images/case-studies/objects/air-cloud.webp",
    mediaFit: "contain",
  },
];
