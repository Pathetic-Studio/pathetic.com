// sanity/queries/grid/grid-row-animated.ts
import { groq } from "next-sanity";
import { gridCardAnimatedQuery } from "@/sanity/queries/grid/grid-card-animated";
import { gridCardQuery } from "@/sanity/queries/grid/grid-card";
import { pricingCardQuery } from "@/sanity/queries/grid/pricing-card";
import { gridPostQuery } from "@/sanity/queries/grid/grid-post";
import { gridTextBlockQuery } from "@/sanity/queries/grid/grid-text-block";
import { bodyQuery } from "@/sanity/queries/shared/body";
import { linkQuery } from "@/sanity/queries/shared/link";

// @sanity-typegen-ignore
export const gridRowAnimatedQuery = groq`
  _type == "grid-row-animated" => {
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

    // Grid-level title
    gridTitle,

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
      ${gridCardAnimatedQuery},
      ${gridCardQuery},
      ${pricingCardQuery},
      ${gridPostQuery},
      ${gridTextBlockQuery},
    },

    animation{
      stagger,
      duration,
    },
  }
`;
