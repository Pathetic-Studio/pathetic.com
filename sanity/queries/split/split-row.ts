// sanity/queries/split/split-row.ts
import { groq } from "next-sanity";
import { splitContentQuery } from "./split-content";
import { splitCardsListQuery } from "./split-cards-list";
import { splitImageQuery } from "./split-image";
import { splitImageAnimateQuery } from "./split-image-animate";
import { splitInfoListQuery } from "./split-info-list";
import { bodyQuery } from "../shared/body";
import { linkQuery } from "../shared/link";

// @sanity-typegen-ignore
export const splitRowQuery = groq`
  _type == "split-row" => {
    _type,
    _key,
    padding,
    colorVariant,
    noGap,
    tagLine,
    title,
    body[]{
      ${bodyQuery}
    },
    links[]{
      ${linkQuery}
    },
    introPadding,

    splitColumns[]{
      ${splitContentQuery},
      ${splitCardsListQuery},
      ${splitImageQuery},
      ${splitImageAnimateQuery},
      ${splitInfoListQuery},
    },
  }
`;
