// sanity/queries/meme-booth.ts
import { groq } from "next-sanity";

export const MEME_BOOTH_QUERY = groq`
  *[_type == "memeBooth" && _id == "memeBooth"][0]{
    title,
    subtitle,
    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
    }
  }
`;
