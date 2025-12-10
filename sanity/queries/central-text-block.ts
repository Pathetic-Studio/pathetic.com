// sanity/queries/central-text-block.ts
import { groq } from "next-sanity";
import { bodyQuery } from "./shared/body";

// @sanity-typegen-ignore
export const centralTextBlockQuery = groq`
  _type == "central-text-block" => {
    _type,
    _key,
    body[]{
      ${bodyQuery}
    },
  }
`;
