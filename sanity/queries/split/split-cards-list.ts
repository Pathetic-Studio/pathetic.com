// sanity/queries/split/split-cards-list.ts
import { groq } from "next-sanity";
import { bodyQuery } from "../shared/body";

// @sanity-typegen-ignore
export const splitCardsListQuery = groq`
  _type == "split-cards-list" => {
    _type,
    _key,
    list[]{
      tagLine,
      title,
      body[]{
        ${bodyQuery}
      },
    },
  }
`;
