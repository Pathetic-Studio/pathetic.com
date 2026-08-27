// sanity/queries/page-loader.ts
import { groq } from "next-sanity";
import { linkQuery } from "./shared/link";
import { bodyQuery } from "./shared/body";

export const PAGE_LOADER_QUERY = groq`
  *[_type == "pageLoader" && _id == "pageLoader"][0]{
    enabled,
    oncePerSession,
    usePatheticIntroPreset,
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
    background{
      enabled,
      layout,
      border,
      style,
      color,
      fromColor,
      toColor,
      angle,
      image,
      customHeight,
      verticalOffsetPercent
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
        size,
        xMobile,
        yMobile,
        sizeMobile
      },
      enableClickToAddEyes
    },
  }
`;
