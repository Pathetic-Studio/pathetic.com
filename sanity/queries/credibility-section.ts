import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { anchorQuery } from "./shared/anchor";

// @sanity-typegen-ignore
export const credibilitySectionQuery = groq`
  _type == "credibility-section" => {
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
    displayTextStyle{
      fillColor{hex},
      fontWeight,
      outline,
      outlineColor{hex},
      outlineWidth,
      outlinePosition
    },
    title,
    leftLogos[]{
      _key,
      ${imageQuery}
    },
    rightLogos[]{
      _key,
      ${imageQuery}
    },
    rotationDuration
  }
`;
