import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";
import { bodyQuery } from "../shared/body";
import { linkQuery } from "../shared/link";

// @sanity-typegen-ignore
// object-detect-image query
export const objectDetectImageQuery = groq`
  _type == "object-detect-image" => {
    _type,
    _key,
    title,
    body[]{
      ${bodyQuery}
    },
    accentColor,
    image{
      ${imageQuery}
    },
    link{
      ${linkQuery}
    },
    customWidth,
    customHeight,
    layout{
      colStart,
      colSpan,
      rowSpan
    },
  }
`;

