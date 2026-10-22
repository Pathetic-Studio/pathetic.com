import type { CaseStudyImage } from "./case-studies";

// Original photographs stay in the viewer. Selected thumbnail-only cutouts
// fade back to the complete photograph on hover or keyboard focus.
const suppliedImages: Record<string, CaseStudyImage[]> = {
  "square-cash-app": [
    { src: "/images/case-studies/bts/square-cash-app/square-cash-app-01.webp", alt: "Guests wearing PATHETIC tees at Larry’s Cà Phê", width: 768, height: 1024 },
    { src: "/images/case-studies/bts/square-cash-app/square-cash-app-02.webp", alt: "Visitors browsing the PATHETIC merch drop at Larry’s Cà Phê", width: 768, height: 1024 },
    { src: "/images/case-studies/bts/square-cash-app/square-cash-app-03.webp", alt: "Shopping the Square and Cash App neighborhood pop-up", width: 768, height: 1024 },
    { src: "/images/case-studies/bts/square-cash-app/square-cash-app-04.webp", alt: "Larry’s Cà Phê cup with Square, Cash App and PATHETIC logos", width: 768, height: 1024 },
    { src: "/images/case-studies/bts/square-cash-app/square-cash-app-05.webp", alt: "The Williamsburg Experience neighborhood archetype meme", width: 820, height: 958 },
    { src: "/images/case-studies/bts/square-cash-app/square-cash-app-06.webp", alt: "The busy neighborhood merch pop-up at Larry’s Cà Phê", width: 768, height: 1024 },
    { src: "/images/case-studies/bts/square-cash-app/square-cash-app-07.webp", alt: "PATHETIC stickers and printed neighborhood memes from the activation", width: 768, height: 1024 },
  ],
  dictation: [
    {
      src: "/images/case-studies/bts/dictation/dictation-bts-01.webp",
      alt: "Film crew preparing the Universal Dictation studio set",
      width: 960,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/dictation/dictation-bts-02.webp",
      alt: "Universal Dictation crew silhouetted beneath the studio lighting",
      width: 1440,
      height: 960,
    },
    {
      src: "/images/case-studies/bts/dictation/dictation-bts-03.webp",
      alt: "Crew setting up the chair for the Universal Dictation film",
      width: 960,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/dictation/dictation-bts-04.webp",
      cutout: "/images/case-studies/bts/dictation/dictation-bts-04-cutout.webp",
      alt: "Camera operator filming Mina Fahmi at the Dictation desk",
      width: 1440,
      height: 960,
    },
    {
      src: "/images/case-studies/bts/dictation/dictation-bts-05.webp",
      alt: "Crew rehearsing the continuous Dictation camera move",
      width: 1440,
      height: 960,
    },
    {
      src: "/images/case-studies/bts/dictation/dictation-bts-06.webp",
      alt: "Close view of the camera rig behind the Dictation desk",
      width: 1440,
      height: 960,
    },
  ],
  "youre-on-mute": [
    {
      src: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-01.webp",
      alt: "Filming You’re on Mute outdoors with the boom microphone",
      width: 960,
      height: 1280,
    },
    {
      src: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-02.webp",
      alt: "Lighting and camera setup for a You’re on Mute dining scene",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-03.webp",
      alt: "You’re on Mute cast and crew around the dining table",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-04.webp",
      cutout: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-04-cutout.webp",
      alt: "Camera operator reviewing a You’re on Mute take",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-05.webp",
      alt: "Filming a You’re on Mute scene in the apartment library",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-06.webp",
      cutout: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-06-cutout.webp",
      alt: "Rehearsing a You’re on Mute scene beside the bookshelves",
      width: 1152,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/youre-on-mute/youre-on-mute-bts-07.webp",
      alt: "You’re on Mute cast preparing for a kitchen scene",
      width: 1080,
      height: 1440,
    },
  ],
  "bless-this-desk": [
    {
      src: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-01.webp",
      alt: "Preparing the bedroom workspace for Bless This Desk",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-02.webp",
      alt: "Camera crew filming the Bless This Desk bedroom makeover",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-03.webp",
      cutout: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-03-cutout.webp",
      alt: "Bless This Desk crew carrying a red coat rack into the room",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-04.webp",
      alt: "Presenting a workspace makeover for Bless This Desk",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-05.webp",
      cutout: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-05-cutout.webp",
      alt: "Trying the new home workspace for Bless This Desk",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-06.webp",
      alt: "Camera crew filming a Bless This Desk episode",
      width: 1080,
      height: 1440,
    },
    {
      src: "/images/case-studies/bts/bless-this-desk/bless-this-desk-bts-07.webp",
      alt: "Bless This Desk participants and crew relaxing after filming",
      width: 1080,
      height: 1440,
    },
  ],
};

export const CASE_STUDY_BTS: Record<string, CaseStudyImage[]> = Object.fromEntries(
  Object.entries(suppliedImages).map(([project, images]) => [project,
    images.map((image) => ({ ...image, thumbnail: image.src.replace(/\.webp$/, "-thumb.webp") })),
  ]),
);
