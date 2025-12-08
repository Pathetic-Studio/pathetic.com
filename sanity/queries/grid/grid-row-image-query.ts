import { groq } from "next-sanity";
import { bodyQuery } from "../shared/body";
import { linkQuery } from "../shared/link";
import { objectDetectImageQuery } from "./object-detect-image";
import { imageCardQuery } from "./image-card";
import { anchorQuery } from "../shared/anchor";

// @sanity-typegen-ignore
export const gridRowImageQuery = groq`
  _type == "grid-row-image" => {
    _type,
    _key,
        ${anchorQuery},
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

    // custom gaps from Sanity, any CSS length
    rowGap,
    columnGap,

    items[]{
      ${objectDetectImageQuery},
      ${imageCardQuery},
    },
  }
`;
