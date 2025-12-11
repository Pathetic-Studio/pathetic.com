// sanity/queries/grid/grid-row.ts
import { groq } from "next-sanity";
import { gridCardQuery } from "@/sanity/queries/grid/grid-card";
import { pricingCardQuery } from "@/sanity/queries/grid/pricing-card";
import { gridPostQuery } from "@/sanity/queries/grid/grid-post";
import { gridTextBlockQuery } from "@/sanity/queries/grid/grid-text-block";
import { bodyQuery } from "@/sanity/queries/shared/body";
import { linkQuery } from "@/sanity/queries/shared/link";
import { anchorQuery } from "../shared/anchor";

// @sanity-typegen-ignore
export const gridRowQuery = groq`
  _type == "grid-row" => {
    _type,
    _key,
    ${anchorQuery},
    padding,
    colorVariant,

    // Layout behavior
    pinToViewport,
    pinDuration,

    // Intro content
    tagLine,
    title,
    body[]{
      ${bodyQuery}
    },
    links[]{
      ${linkQuery}
    },
    introPadding,

    // Grid-level title
    gridTitle,

    // Feature (shared with hero)
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
      },
      enableClickToAddEyes
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

    // Custom grid container overrides
    gridPaddingTop,
    gridPaddingBottom,
    gridPaddingLeft,
    gridPaddingRight,
    gridRowGap,
    gridColumnGap,

    gridColumns,
    columns[]{
      ${gridCardQuery},
      ${pricingCardQuery},
      ${gridPostQuery},
      ${gridTextBlockQuery},
    },
  }
`;
