// components/blocks/grid/grid-row-image.query.ts
import { groq } from "next-sanity";
import { bodyQuery } from "../shared/body";
import { linkQuery } from "../shared/link";
import { insetBackgroundQuery } from "../shared/inset-background";
import { objectDetectImageQuery } from "./object-detect-image";
import { imageCardQuery } from "./image-card";

// @sanity-typegen-ignore
export const gridRowImageQuery = groq`
  _type == "grid-row-image" => {
    _type,
    _key,
    padding,
    colorVariant,

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

    // custom gaps from Sanity, any CSS length
    rowGap,
    columnGap,

    insetBackground{
      ${insetBackgroundQuery}
    },

    items[]{
      ${objectDetectImageQuery},
      ${imageCardQuery},
    },
  }
`;
