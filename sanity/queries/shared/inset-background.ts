// sanity/queries/shared/inset-background.ts
import { groq } from "next-sanity";
import { imageQuery } from "./image";

// @sanity-typegen-ignore
export const insetBackgroundQuery = groq`
  enabled,
  behavior,
  width,
  height,
  customWidth,
  customHeight,
  placementMode,
  verticalOffsetPercent,
  position,
  border,
  style,
  image{
    ${imageQuery}
  },
  color,
  fromColor,
  toColor,
  angle
`;
