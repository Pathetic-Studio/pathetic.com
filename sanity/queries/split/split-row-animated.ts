// sanity/queries/split/split-row-animated.ts
import { groq } from "next-sanity";
import { splitContentQuery } from "./split-content";
import { splitCardsListAnimatedQuery } from "./split-cards-list-animated";
import { splitImageQuery } from "./split-image";
import { splitImageAnimateQuery } from "./split-image-animate";
import { splitInfoListQuery } from "./split-info-list";
import { bodyQuery } from "../shared/body";
import { linkQuery } from "../shared/link";

// @sanity-typegen-ignore
export const splitRowAnimatedQuery = groq`
  _type == "split-row-animated" => {
    _type,
    _key,
    padding,
    colorVariant,
    noGap,
    tagLine,
    animateText,
    title,
    body[]{
      ${bodyQuery}
    },
    links[]{
      ${linkQuery}
    },
    introPadding,
    stickyIntro,

    splitColumns[]{
      ${splitContentQuery},
      ${splitCardsListAnimatedQuery},
      ${splitImageQuery},
      ${splitImageAnimateQuery},
      ${splitInfoListQuery},
    },
  }
`;
