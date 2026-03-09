import { groq } from "next-sanity";
import { linkQuery } from "./shared/link";

// @sanity-typegen-ignore
export const footerQuery = groq`
  _type == "footer" => {
    _type,
    _key,
    footerLeftLinks[]{
      ${linkQuery}
    },
    footerRightLinks[]{
      ${linkQuery}
    }
  }
`;
