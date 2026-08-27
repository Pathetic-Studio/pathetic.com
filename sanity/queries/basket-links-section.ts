import { groq } from "next-sanity";
import { anchorQuery } from "./shared/anchor";
import { imageQuery } from "./shared/image";
import { linkQuery } from "./shared/link";

// @sanity-typegen-ignore
export const basketLinksSectionQuery = groq`
  _type == "basket-links-section" => {
    _type,
    _key,
    ${anchorQuery},
    title,
    hint,
    backgroundColor{hex},
    basketImage{${imageQuery}},
    items[]{
      _key,
      title,
      localAsset,
      size,
      startX,
      startY,
      image{${imageQuery}},
      link{${linkQuery}}
    }
  }
`;
