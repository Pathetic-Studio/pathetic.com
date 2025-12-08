import { groq } from "next-sanity";
import { bodyQuery } from "../shared/body";
import { linkQuery } from "../shared/link";
import { objectDetectImageQuery } from "./object-detect-image";
import { imageCardQuery } from "./image-card";

// @sanity-typegen-ignore
export const gridRowGrabQuery = groq`
  _type == "grid-row-grab" => {
    _type,
    _key,
    padding,
    colorVariant,

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
        size
      }
    },

    tagLine,
    title,
    body[]{
      ${bodyQuery}
    },
    links[]{
      ${linkQuery}
    },
    introPadding,

    gridType,
    gridColumns,
    mobileHorizontalTrack,

    rowGap,
    columnGap,

    items[]{
      ${objectDetectImageQuery},
      ${imageCardQuery},
    },
  }
`;
