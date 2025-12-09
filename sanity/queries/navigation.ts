import { groq } from "next-sanity";
import { linkQuery } from "./shared/link";

export const NAVIGATION_QUERY = groq`
  *[_type == "navigation"]{
    _type,
    _key,
    instagram,
    leftLinks[]{
      ${linkQuery}
    },
    rightLinks[]{
      ${linkQuery}
    },
    footerLeftLinks[]{
      ${linkQuery}
    },
    footerRightLinks[]{
      ${linkQuery}
    }
  }
`;
