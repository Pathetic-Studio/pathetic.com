// Local editorial first pass. Deliberately independent of the shared Sanity dataset.
import type { WorkGalleryImage } from "./instagram-posts";
import { CASE_STUDY_BTS } from "./case-study-bts";
import {
  AIR_OBJECT,
  CASH_APP_OBJECT,
  DEEL_OBJECT,
  RAMP_OBJECT,
  SANDBAR_OBJECT,
  SQUARE_OBJECT,
} from "./work-assets";

export type CaseStudyImage = WorkGalleryImage & {
  fit?: "cover" | "contain";
  /** Optional small thumbnail; the popup continues to use src. */
  thumbnail?: string;
  /** Transparent thumbnail on the original photo canvas; hover reveals src. */
  cutout?: string;
};

// The same floating gallery can belong to a project or sit outside the
// project blocks on a client page. Keep project-specific imagery with its project.
export type CaseStudyGallery = {
  id: string;
  title?: string;
  /** Maximum columns on desktop; tablet and mobile reduce this automatically. */
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  images: CaseStudyImage[];
};

export type CaseStudyFilm = {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  preview?: string;
};

export type CaseStudyText = {
  text: string;
  href?: string;
  strong?: boolean;
  emphasis?: boolean;
};
export type CaseStudyCopyBlock =
  | { type: "paragraph"; content: CaseStudyText[] }
  | { type: "list"; items: CaseStudyText[][] };

export type CaseStudyCampaign = {
  id: string;
  title: string;
  format: string;
  result?: string;
  copy: string | CaseStudyCopyBlock[];
  features?: { title: string; content: CaseStudyText[] }[];
  film?: CaseStudyFilm;
  link?: { label: string; href: string };
  galleries?: CaseStudyGallery[];
};

export type CaseStudy = {
  slug: string;
  client: string;
  intro: string;
  accent: string;
  ink?: string;
  object: CaseStudyImage & { presentation?: "photostrip" | "ramp-card" };
  additionalObjects?: CaseStudy["object"][];
  cover: CaseStudyImage;
  campaigns: CaseStudyCampaign[];
  galleries?: CaseStudyGallery[];
};

const media = "/media/case-studies";

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "deel",
    client: "Deel",
    intro:
      "Deel sells payroll, HR and compliance to companies hiring anywhere. We work with their brand team to produce series, events and campaigns people want to watch, attend, and share.",
    accent: "#242424",
    ink: "#ffffff",
    object: DEEL_OBJECT,
    cover: {
      src: `${media}/deel/yom-poster.webp`,
      alt: "You’re on Mute, a comedy series for Deel",
      width: 720,
      height: 1280,
    },
    campaigns: [
      {
        id: "youre-on-mute",
        title: "You’re on Mute",
        format: "Social Series",
        result: "2M+ views",
        galleries: [
          {
            id: "youre-on-mute-bts",
            columns: 4,
            images: CASE_STUDY_BTS["youre-on-mute"],
          },
        ],
        copy: "Global remote work is Deel’s category and its customers’ daily life, so we made a comedy about it: a four-part series starring Brett Neustrom with guest creators, built around the absurd complications of working from anywhere. Stay tuned for Season 2…",
        film: {
          src: `${media}/deel/yom.mp4`,
          poster: `${media}/deel/yom-poster.webp`,
          width: 720,
          height: 1280,
          label: "Watch the trailer",
          preview: "/media/work/yom-preview.mp4",
        },
      },
      {
        id: "bless-this-desk",
        title: "Bless This Desk",
        format: "Social Series",
        result: "1M+ views",
        galleries: [
          {
            id: "bless-this-desk-bts",
            columns: 4,
            images: CASE_STUDY_BTS["bless-this-desk"],
          },
        ],
        copy: "Deel IT equips remote teams, making remote work delightful. So we launched “Bless This Desk”, a social series hosted by Jean-Luc, bestowing glow-ups on the home workspaces of four New Yorkers using kit supplied by Deel IT. A classic makeover format with real people and real stories.",
        film: {
          src: `${media}/deel/bless-this-desk.mp4`,
          poster: `${media}/deel/bless-this-desk-poster.webp`,
          width: 720,
          height: 1278,
          label: "Watch Louisa’s episode",
          preview: "/media/work/bless-this-desk-preview.mp4",
        },
      },
      {
        id: "birthday-bakery",
        title: "Birthday Bakery",
        format: "IRL Activation",
        result: "500+ UGC",
        copy: "We took over Hoso Basque, a cheesecake bakery in Paris, with a DJ, free cheesecake and Selma Kaci delivering cakes to Deel’s community across the city. The event doubled as a shoot, with creator and event footage running across Deel’s channels afterwards. Nine days from brief to basque-cheesecake party!",
        film: {
          src: `${media}/deel/birthday-bakery.mp4`,
          poster: `${media}/deel/birthday-bakery-poster.webp`,
          width: 720,
          height: 1280,
          label: "Watch the party",
          preview: "/media/work/birthday-bakery-preview.mp4",
        },
      },
    ],
  },
  {
    slug: "stream-by-sandbar",
    client: "Stream by Sandbar",
    intro:
      "Sandbar makes Stream, a private voice ring for capturing thoughts and dictating across your devices. We work with the team to bring the brand, product and vision to life.",
    accent: "#d3cbbf",
    object: SANDBAR_OBJECT,
    cover: {
      src: `${media}/sandbar/dictation-poster.webp`,
      alt: "Mina Fahmi demonstrating Stream’s Universal Dictation",
      width: 1600,
      height: 844,
    },
    campaigns: [
      {
        id: "whats-on-your-mind",
        title: "What’s On Your Mind",
        format: "Brand Series",
        copy: "We created a brand series for Stream which followed 5 influential New Yorkers, documenting how they use Stream to develop thoughts and organise their life. The series focused on practical use cases, rather than dystopian predictions and showcased the ring being used to create more connection between people and their loved ones.",
        film: {
          src: `${media}/sandbar/whats-on-your-mind.mp4`,
          poster: `${media}/sandbar/whats-on-your-mind-poster.webp`,
          width: 720,
          height: 1280,
          label: "Watch Brooke’s episode",
          preview: "/media/work/whats-on-your-mind-preview.mp4",
        },
      },
      {
        id: "universal-dictation",
        title: "Universal Dictation Launch Film",
        format: "Product Film",
        result: "2M+ views",
        copy: "Universal Dictation enables push-to-talk from Stream into any text field on your iPhone or Mac, with no app switching in between. To show the handoff without a cut, we shot a one-minute demo with Mina Fahmi as a single continuous camera shot on a stark, Dune-inspired set. The film was picked up by the biggest names on tech Twitter.",
        film: {
          src: `${media}/sandbar/dictation.mp4`,
          poster: `${media}/sandbar/dictation-poster.webp`,
          width: 1920,
          height: 1080,
          label: "Watch the film",
          preview: "/media/work/dictation-preview.mp4",
        },
        galleries: [
          {
            id: "dictation-bts",
            images: CASE_STUDY_BTS.dictation,
          },
          {
            id: "dictation-stills",
            images: [
              {
                src: `${media}/sandbar/stream-ring.webp`,
                alt: "The chrome Stream ring on the sculptural set",
                width: 1600,
                height: 844,
              },
              {
                src: `${media}/sandbar/dictation-set.webp`,
                alt: "Mina Fahmi seated on the Dune-inspired Universal Dictation set",
                width: 1600,
                height: 844,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "air",
    client: "Air",
    intro:
      "Air makes creative operations software for marketing teams. We brought them our proven viral format and turned it into a sign-up engine.",
    accent: "#1b99f4",
    ink: "#ffffff",
    object: AIR_OBJECT,
    cover: {
      src: `${media}/air/meme-booth.webp`,
      alt: "The Air Meme Booth being shared on Instagram",
      width: 602,
      height: 1308,
      crop: { x: 0, y: 180, width: 602, height: 847 },
    },
    campaigns: [
      {
        id: "meme-booth",
        title: "Meme Booth Campaign",
        format: "Microsite & Distribution",
        result: "1M+ views, 13K sign-ups",
        copy: "The Meme Booth started as a PATHETIC experiment. We trained AI on 1,000+ memes from five years of @pathetic, built on Google’s Nano Banana Pro, and made a web app that turns any photo into a personalised starter pack meme. After 20K generations in 24-hours, we licensed it: a free, co-branded experience with an Air signup flow, amplified with a creator campaign, original memes and distribution through @pathetic.",
        film: {
          src: `${media}/air/mike-explainer.mp4`,
          poster: `${media}/air/mike-explainer-poster.webp`,
          width: 720,
          height: 1280,
          label: "Watch Mike’s explainer",
          preview: "/media/work/meme-booth-preview.mp4",
        },
        link: { label: "Live experience", href: "https://air.inc/meme" },
        galleries: [
          {
            id: "meme-booth-community",
            images: [
              {
                src: `${media}/air/meme-booth.webp`,
                alt: "An Air Meme Booth starter pack shared to Instagram Stories",
                width: 602,
                height: 1308,
                crop: { x: 0, y: 180, width: 602, height: 847 },
              },
              {
                src: `${media}/air/booth-in-action.webp`,
                alt: "A community member trying the Air Meme Booth",
                width: 600,
                height: 1066,
              },
              {
                src: `${media}/air/community-style.webp`,
                alt: "A pink-jacket outfit turned into an Air Meme Booth starter pack",
                width: 600,
                height: 1304,
                crop: { x: 0, y: 180, width: 600, height: 920 },
              },
              {
                src: `${media}/air/community.webp`,
                alt: "A member of the community sharing their personalised starter pack and tagging Air",
                width: 602,
                height: 1308,
                crop: { x: 0, y: 180, width: 602, height: 924 },
              },
              {
                src: `${media}/air/community-starter-pack.webp`,
                alt: "A community member sharing the starter pack made from her photo",
                width: 600,
                height: 1304,
                crop: { x: 0, y: 180, width: 600, height: 920 },
              },
              {
                src: `${media}/air/community-outfit.webp`,
                alt: "An outfit photo and its personalised Air Meme Booth result",
                width: 600,
                height: 1304,
                crop: { x: 0, y: 208, width: 600, height: 897 },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "ramp",
    client: "Ramp",
    intro:
      "Ramp is finance automation for businesses: cards, expenses and bills, all in one place. A revolutionary product with a revolutionary team, looking for another killer…",
    accent: "#f6f4f3",
    object: {
      ...RAMP_OBJECT,
      presentation: "ramp-card",
    },
    cover: RAMP_OBJECT,
    campaigns: [
      {
        id: "viral-creative-producer",
        title: "Viral Creative Producer",
        format: "Recruitment Ad",
        result: "100K+ views",
        copy: "Ramp was hiring a Viral Creative Producer. Leaning into the iconic “Greatest job in the world” ad, we turned the job listing into content, seeding via LinkedIn creators and the @pathetic community.",
        film: {
          src: `${media}/ramp/viral-creative-producer.mp4`,
          poster: `${media}/ramp/viral-creative-producer-poster.webp`,
          preview: "/media/work/viral-creative-producer-preview.mp4",
          width: 1280,
          height: 720,
          label: "Watch the film",
        },
      },
    ],
  },
  {
    slug: "square-cash-app",
    client: "Square & Cash App",
    intro:
      "Square runs payments for local businesses. Cash App is how their customers pay. We worked with both brands to make that relationship visible across one Brooklyn neighborhood.",
    accent: "#00d51e",
    ink: "#ffffff",
    object: SQUARE_OBJECT,
    additionalObjects: [CASH_APP_OBJECT],
    cover: {
      src: "/images/credibility/square.webp",
      alt: "Square",
      width: 320,
      height: 81,
      fit: "contain",
    },
    campaigns: [
      {
        id: "keep-it-in-the-neighborhood",
        title: "Keep It In The Neighborhood",
        format: "IRL + Meme Campaign",
        result: "4.5M+ views",
        copy: [
          { type: "paragraph", content: [
            { text: "We supported ", strong: true },
            { text: "LBA", href: "https://www.lazyboyagency.com/", strong: true },
            { text: " in a full cultural activation around one simple idea: ", strong: true },
            { text: "when you support local businesses, you support your neighborhood.", strong: true, emphasis: true },
          ] },
          { type: "paragraph", content: [
            { text: 'This brought “Keep It In The Neighborhood” to life with:' },
          ] },
        ],
        features: [
          { title: "IRL pop-up", content: [
            { text: "A PATHETIC merch drop at Larry’s Cà Phê, where followers showed up & bought tees with Cash App." },
          ] },
          { title: "Meme Content", content: [
            { text: "Hyper-specific " },
            { text: "neighborhood archetypes", href: "https://www.instagram.com/p/DRcVq2FDiKu/?img_index=1" },
            { text: " that made locals feel seen, showed Square understands culture, and promoted the activation in a way people wanted to share, not scroll past." },
          ] },
          { title: "Creator content", content: [
            { text: "TonyCash", href: "https://www.instagram.com/tonycashnyc/?hl=en" },
            { text: ", " },
            { text: "Pooja", href: "https://www.instagram.com/winnie_thepooj/?hl=en" },
            { text: ", and other local creators visited participating Square merchants across Williamsburg." },
          ] },
          { title: "Pedicab circuit", content: [
            { text: "Branded pedicabs connected participating retailers." },
          ] },
          { title: "Brooklyn Coffee Shop collab", content: [
            { text: "Embedded Square & Cash App", href: "https://www.instagram.com/p/DRfKxLHDd8l/?hl=en" },
            { text: " into a fast growing cultural staple." },
          ] },
        ],
        film: {
          src: `${media}/square/neighborhood.mp4`,
          poster: `${media}/square/neighborhood-poster.webp`,
          preview: "/media/work/keep-it-in-the-neighborhood-preview.mp4",
          width: 720,
          height: 1280,
          label: "Watch the campaign",
        },
        galleries: [
          {
            id: "neighborhood-activation",
            images: CASE_STUDY_BTS["square-cash-app"],
          },
        ],
      },
    ],
  },
];

export function getCaseStudy(slug: string) {
  return CASE_STUDIES.find((study) => study.slug === slug);
}

export type CaseStudyTile = {
  id: string;
  title: string;
  caption?: string;
  href: string;
  image: CaseStudyImage;
  preview?: string;
  object?: CaseStudy["object"];
  additionalObjects?: CaseStudy["object"][];
  accent?: string;
  ink?: string;
};

// The supplied document groups eight campaigns under five client case studies.
// Only those five case-study destinations belong in the overview.
export function getCaseStudyTiles(): CaseStudyTile[] {
  return CASE_STUDIES.map((study) => ({
    id: study.slug,
    title: study.client,
    caption: [
      ...new Set(study.campaigns.map((campaign) => campaign.format)),
    ].join(" / "),
    href: `/work/${study.slug}`,
    image: study.cover,
    object: study.object,
    additionalObjects: study.additionalObjects,
    accent: study.accent,
    ink: study.ink,
    preview: study.campaigns.find(
      (campaign) => campaign.film?.poster === study.cover.src,
    )?.film?.preview,
  }));
}
