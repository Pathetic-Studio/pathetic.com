//sanity/queries/grid/image-card.ts
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";
import { bodyQuery } from "../shared/body";
import { linkQuery } from "../shared/link";

// @sanity-typegen-ignore
export const imageCardQuery = groq`
  _type == "image-card" => {
    _type,
    _key,
    title,
    body[]{
      ${bodyQuery}
    },
    image{
      ${imageQuery}
    },
    link{
      ${linkQuery}
    },
    layout{
      colStart,
      colSpan,
      rowSpan
    },
  }
`;
