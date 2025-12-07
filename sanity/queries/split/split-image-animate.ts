// sanity/queries/split/split-image-animate.ts
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";

// @sanity-typegen-ignore
export const splitImageAnimateQuery = groq`
  _type == "split-image-animate" => {
    _type,
    _key,
    useCustomEffect,
    images[]{
      ${imageQuery}
    },
  }
`;
