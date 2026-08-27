import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";
import { imageQuery } from "./shared/image";
import { linkQuery } from "./shared/link";

export const CASE_STUDY_QUERY = groq`
  *[_type == "caseStudy" && _id == "caseStudy"][0]{
    _id,
    title,
    eyebrow,
    heroImage{
      ${imageQuery}
    },
    heroOrbitImages[]{
      _key,
      ${imageQuery}
    },
    intro[]{
      ${bodyQuery}
    },
    storySections[]{
      _key,
      image{
        ${imageQuery}
      },
      copy[]{
        ${bodyQuery}
      },
      imageWidth
    },
    relatedTitle,
    relatedProjects[]{
      _key,
      title,
      image{
        ${imageQuery}
      },
      link{
        ${linkQuery}
      }
    },
    meta_title,
    meta_description,
    noindex,
    ogImage{
      ${imageQuery}
    }
  }
`;
