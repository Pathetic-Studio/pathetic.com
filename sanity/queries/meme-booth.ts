import { groq } from "next-sanity";
import { linkQuery } from "./shared/link";

export const MEME_BOOTH_QUERY = groq`
  *[_type == "memeBooth" && _id == "memeBooth"][0]{
    title,
    subtitle,
    showNewsletterModalOnView,

    // Desktop overrides
    showDesktopRightLinks,
    leftNavReplace[]{
      ${linkQuery}
    },

    // Mobile overrides
    showMobileBottomLinks,
    mobileTopReplace[]{
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
