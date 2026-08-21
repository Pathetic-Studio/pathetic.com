import { groq } from "next-sanity";
import { gridCardAnimatedQuery } from "@/sanity/queries/grid/grid-card-animated";
import { gridCardQuery } from "@/sanity/queries/grid/grid-card";
import { pricingCardQuery } from "@/sanity/queries/grid/pricing-card";
import { gridPostQuery } from "@/sanity/queries/grid/grid-post";
import { gridTextBlockQuery } from "@/sanity/queries/grid/grid-text-block";
import { bodyQuery } from "@/sanity/queries/shared/body";
import { linkQuery } from "@/sanity/queries/shared/link";

// @sanity-typegen-ignore
export const beliefSectionQuery = groq`
  _type == "belief-section" => {
    _type,
    _key,
    padding,
    colorVariant,
    tagLine,
    title,
    body[]{
      ${bodyQuery}
    },
    links[]{
      ${linkQuery}
    },
    introPadding,
    gridTitle,
    cloudsEnabled,
    cloudPartDuration,
    cloudImage{
      alt,
      asset->{
        _id,
        url,
        metadata{
          lqip,
          dimensions{
            width,
            height
          }
        }
      }
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
