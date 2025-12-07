// sanity/queries/section-spacer.ts

import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const sectionSpacerQuery = groq`
  _type == "section-spacer" => {
    _type,
    _key,
    height,
  }
`;
