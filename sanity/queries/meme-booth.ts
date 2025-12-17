// sanity/queries/meme-booth.ts
import { groq } from "next-sanity";
import { linkQuery } from "./shared/link";

export const MEME_BOOTH_QUERY = groq`
  *[_type == "memeBooth" && _id == "memeBooth"][0]{
    title,
    subtitle,
    showNewsletterModalOnView,

    showDesktopRightLinks,

    // ✅ replacement links have the exact same shape as everywhere else
    leftNavReplace[]{
      ${linkQuery}
    },

    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions { width, height }
        }
      },
    }
  }
`;
