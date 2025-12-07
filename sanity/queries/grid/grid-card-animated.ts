// sanity/queries/grid/grid-card-animated.ts
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";
import { linkQuery } from "../shared/link";

// @sanity-typegen-ignore
export const gridCardAnimatedQuery = groq`
  _type == "grid-card-animated" => {
    _type,
    _key,
    title,
    excerpt,
    image{
      ${imageQuery}
    },
    link{
      ${linkQuery}
    },
    caption{
      text,
      bgColor,
      textColor,
      side,
      xPercent,
      yPercent
    },
  }
`;
