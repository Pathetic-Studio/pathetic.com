// sanity/queries/blocks/grid-text-block.ts
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";
import { linkQuery } from "../shared/link";
import { bodyQuery } from "../shared/body";

// @sanity-typegen-ignore
export const gridTextBlockQuery = groq`
  _type == "grid-text-block" => {
    _type,
    _key,
    titlePortable[]{
      ${bodyQuery}
    },
    bodyPortable[]{
      ${bodyQuery}
    },
    image{
      ${imageQuery}
    },
    link{
      ${linkQuery}
    },
    showButton,

    // EFFECT STYLE
    effectStyle,

    // shape config (used when effectStyle == "shape")
    shape,
    blurShape,
    shapeHasBorder,

    // bevel
    bevel,

    // base colour scheme
    colorScheme,
    colorBgCustomToken,
    colorTextCustomToken,

    // hover colour scheme
    hoverColorChange,
    hoverColorScheme,
    hoverColorBgCustomToken,
    hoverColorTextCustomToken,

    // hover scale
    hoverScaleUp,

    // perspective tilt
    enablePerspective,
  }
`;
