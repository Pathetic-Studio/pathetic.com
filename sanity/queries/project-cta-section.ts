import { groq } from "next-sanity";
import { anchorQuery } from "./shared/anchor";
import { imageQuery } from "./shared/image";

// @sanity-typegen-ignore
export const projectCtaSectionQuery = groq`
  _type == "project-cta-section" => {
    _type,
    _key,
    ${anchorQuery},
    title,
    buttonLabel,
    panelColor{hex},
    textColor{hex},
    outlineColor{hex},
    accentColor{hex},
    sparklesEnabled,
    backgroundImage{${imageQuery}}
  }
`;
