// Local editorial first pass. Deliberately independent of the shared Sanity dataset.
import {
  AIR_OBJECT,
  CASH_APP_OBJECT,
  DEEL_OBJECT,
  SQUARE_OBJECT,
} from "./work-assets";

export type CaseStudyImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  fit?: "cover" | "contain";
};

export type CaseStudyFilm = {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  preview?: string;
};

export type CaseStudyCampaign = {
  id: string;
  title: string;
  format: string;
  result: string;
  copy: string;
  film?: CaseStudyFilm;
  link?: { label: string; href: string };
  images?: CaseStudyImage[];
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
  images?: CaseStudyImage[];
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
        images: [
          {
            src: "/images/case-studies/figma/yom-bts.webp",
            alt: "Filming You’re on Mute on location",
            width: 884,
            height: 788,
          },
        ],
        copy: "Global remote work is Deel’s category and its customers’ daily life, so we made a comedy about it: a four-part series starring Brett Neustrom with guest creators, built around the absurd complications of working from anywhere. We conceptualized, developed and cast the series, produced it and designed its identity and social rollout. Stay tuned for Season 2…",
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
        images: [
          {
            src: "/images/case-studies/figma/bless-this-desk-bts.webp",
            alt: "Behind the scenes of Bless This Desk",
            width: 878,
            height: 726,
          },
        ],
        copy: "Deel IT equips remote teams, making remote work delightful. So we launched “Bless This Desk”, a social series hosted by Jean-Luc, bestowing glow-ups on the home workspaces of four New Yorkers using kit supplied by Deel IT. A classic makeover format with real people and real stories. Produced end to end, from casting and makeover, to edit and distribution.",
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
        },
      },
    ],
  },
  {
    slug: "stream-by-sandbar",
    client: "Stream by Sandbar",
    intro:
      "Sandbar makes Stream, a private voice ring for capturing thoughts and dictating across your devices. We work with the team to bring the brand, product and vision to life.",
    accent: "#e9e5df",
    object: {
      src: "/images/case-studies/objects/stream-ring-hires.webp",
      alt: "The Stream ring by Sandbar",
      width: 1254,
      height: 1254,
      fit: "contain",
    },
    cover: {
      src: `${media}/sandbar/dictation-poster.webp`,
      alt: "Mina Fahmi demonstrating Stream’s Universal Dictation",
      width: 1600,
      height: 844,
    },
    campaigns: [
      {
        id: "sdk-launch",
        title: "SDK Launch Film",
        format: "Product Film",
        result: "100K+ views",
        copy: "Stream is a private voice ring for everything on your mind, no matter where you are. So a cliche launch film with the founder sitting at a desk wouldn’t cut it. To announce the SDK, we follow co-founder Kirak Hong through his day, showing the ring doing its job on the move. Creative direction, production and edit.",
        film: {
          src: `${media}/sandbar/sdk.mp4`,
          poster: `${media}/sandbar/sdk-poster.webp`,
          width: 1920,
          height: 1080,
          label: "Watch the film",
        },
      },
      {
        id: "universal-dictation",
        title: "Universal Dictation Launch Film",
        format: "Product Film",
        result: "2M+ views",
        copy: "Universal Dictation enables push-to-talk from Stream into any text field on your iPhone or Mac, with no app switching in between. To show the handoff without a cut, we shot a one-minute demo with Mina Fahmi as a single continuous camera shot on a stark, Dune-inspired set. The film was picked up by the biggest names on tech Twitter. Creative direction, production and edit.",
        film: {
          src: `${media}/sandbar/dictation.mp4`,
          poster: `${media}/sandbar/dictation-poster.webp`,
          width: 1920,
          height: 1080,
          label: "Watch the film",
          preview: "/media/work/dictation-preview.mp4",
        },
      },
    ],
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
  {
    slug: "air",
    client: "Air",
    intro:
      "Air makes creative operations software for marketing teams. We brought them our proven viral format and turned it into a sign-up engine.",
    accent: "#cfe7ff",
    object: AIR_OBJECT,
    cover: {
      src: `${media}/air/meme-booth.webp`,
      alt: "The Air Meme Booth being shared on Instagram",
      width: 602,
      height: 1308,
    },
    campaigns: [
      {
        id: "meme-booth",
        title: "Meme Booth Campaign",
        format: "Microsite & Distribution",
        result: "1M+ views, 13K sign-ups",
        copy: "The Meme Booth started as a PATHETIC experiment. We trained AI on 1,000+ memes from five years of @pathetic, built on Google’s Nano Banana Pro, and made a web app that turns any photo into a personalised starter pack meme. After 20K generations in 24-hours, we licensed it: a free, co-branded experience with an Air signup flow, amplified with a creator campaign, original memes and distribution through @pathetic. Concept, design, development and distribution. End to end.",
        link: { label: "Live experience", href: "https://air.inc/meme" },
      },
    ],
    images: [
      {
        src: `${media}/air/meme-booth.webp`,
        alt: "An Air Meme Booth starter pack shared to Instagram Stories",
        width: 602,
        height: 1308,
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
      },
      {
        src: `${media}/air/community.webp`,
        alt: "A member of the community sharing their personalised starter pack and tagging Air",
        width: 602,
        height: 1308,
      },
      {
        src: `${media}/air/community-starter-pack.webp`,
        alt: "A community member sharing the starter pack made from her photo",
        width: 600,
        height: 1304,
      },
      {
        src: `${media}/air/community-outfit.webp`,
        alt: "An outfit photo and its personalised Air Meme Booth result",
        width: 600,
        height: 1304,
      },
    ],
  },
  {
    slug: "ramp",
    client: "Ramp",
    intro:
      "Ramp is finance automation for businesses: cards, expenses and bills, all in one place. A revolutionary product with a revolutionary team, looking for another killer…",
    accent: "#d4d5d3",
    object: {
      src: `${media}/ramp/card.webp`,
      alt: "Ramp card",
      width: 1396,
      height: 884,
      fit: "contain",
      presentation: "ramp-card",
    },
    cover: {
      src: `${media}/ramp/card.webp`,
      alt: "Ramp card",
      width: 1396,
      height: 884,
      fit: "contain",
    },
    campaigns: [
      {
        id: "viral-creative-producer",
        title: "Viral Creative Producer",
        format: "Recruitment Ad",
        result: "100K+ views",
        copy: "Ramp was hiring a Viral Creative Producer. Leaning into the iconic “Greatest job in the world” ad, we turned the job listing into content, seeding via LinkedIn creators and the @pathetic community. Video edit and distribution.",
      },
    ],
  },
  {
    slug: "square-cash-app",
    client: "Square & Cash App",
    intro:
      "Square runs payments for local businesses. Cash App is how their customers pay. We worked with both brands to make that relationship visible across one Brooklyn neighborhood.",
    accent: "#ceff65",
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
        copy: "When you support a local business, you support your neighborhood, and we teamed up with LBA to build a Williamsburg activation around this. Creators visited Square merchants, branded pedicabs linked the participating shops, a PATHETIC merch drop at Larry’s Cà Phê took payment through Cash App, and a Brooklyn Coffee Shop collab plus neighborhood-archetype memes spread messaging online. Creative strategy, IRL pop-up, apparel, and distribution.",
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
    href: `/case-study/${study.slug}`,
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
