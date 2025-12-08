// sanity/queries/hero/hero-2.ts

import { groq } from "next-sanity";
import { linkQuery } from "../shared/link";
import { bodyQuery } from "../shared/body";

// @sanity-typegen-ignore
export const hero2Query = groq`
  _type == "hero-2" => {
    _type,
    _key,
    tagLine,
    title,
    sectionHeightMobile,
    sectionHeightDesktop,
    customHeightMobile,
    customHeightDesktop,
    body[]{
      ${bodyQuery}
    },
    links[]{
      ${linkQuery}
    },
    insetBackground{
      enabled,
      style,
      color,
      fromColor,
      toColor,
      angle
    },
    feature{
      type,
      images[]{
        _key,
        "url": asset->url
      },
      eyes[]{
        _key,
        x,
        y,
        size
      }
    },
  }
`;
