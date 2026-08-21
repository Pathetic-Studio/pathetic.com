import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { linkQuery } from "./shared/link";
import { anchorQuery } from "./shared/anchor";

// @sanity-typegen-ignore
export const talentMatrixSectionQuery = groq`
  _type == "talent-matrix-section" => {
    _type,
    _key,
    ${anchorQuery},
    eyebrow,
    accentWord,
    title,
    description,
    cta{${linkQuery}},
    sceneColor,
    backgroundColor,
    cityDensity,
    talents[]{
      _key,
      _type,
      label,
      image{${imageQuery}}
    }
  }
`;
