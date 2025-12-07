// sanity/queries/split/split-cards-list-animated.ts
import { groq } from "next-sanity";
import { bodyQuery } from "../shared/body";

// @sanity-typegen-ignore
export const splitCardsListAnimatedQuery = groq`
  _type == "split-cards-list-animated" => {
    _type,
    _key,
    animateInRight,
    list[]{
      tagLine,
      title,
      body[]{
        ${bodyQuery}
      },
    },
  }
`;
