// sanity/queries/grid/grid-row.ts
import { groq } from "next-sanity";
import { gridCardQuery } from "@/sanity/queries/grid/grid-card";
import { pricingCardQuery } from "@/sanity/queries/grid/pricing-card";
import { gridPostQuery } from "@/sanity/queries/grid/grid-post";
import { gridTextBlockQuery } from "@/sanity/queries/grid/grid-text-block";
import { bodyQuery } from "@/sanity/queries/shared/body";
import { linkQuery } from "@/sanity/queries/shared/link";
import { insetBackgroundQuery } from "@/sanity/queries/shared/inset-background";

// @sanity-typegen-ignore
export const gridRowQuery = groq`
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    colorVariant,

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

    // New: grid-level title for the block group
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

    // Inset background panel
    insetBackground{
      ${insetBackgroundQuery}
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
