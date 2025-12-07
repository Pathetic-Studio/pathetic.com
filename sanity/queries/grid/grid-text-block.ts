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
    retroAnimate,

    // shape config (used when effectStyle == "shape")
    shape,
    blurShape,
    shapeHasBorder,

    // hover animation config (used for "normal" and "shape")
    animateOnHover,
    hoverBgColor,
    hoverTextColor,
    hoverScaleUp,
  }
`;
