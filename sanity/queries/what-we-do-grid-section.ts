import { groq } from "next-sanity";
import { imageQuery } from "./shared/image";
import { linkQuery } from "./shared/link";
import { anchorQuery } from "./shared/anchor";

// @sanity-typegen-ignore
export const whatWeDoGridSectionQuery = groq`
  _type == "what-we-do-grid-section" => {
    _type,
    _key,
    ${anchorQuery},
    heading,
    description,
    accentColor,
    backgroundColor,
    pinDuration,
    layers[]{
      _key,
      _type,
      name,
      layerType,
      image{${imageQuery}},
      color,
      fromColor,
      toColor,
      angle,
      depth,
      startScale,
      endScale,
      xOffset,
      yOffset,
      objectPosition,
      opacity,
      blendMode
    },
    services[]{
      _key,
      _type,
      title,
      description,
      image{${imageQuery}},
      hoverImage{${imageQuery}},
      objectDetectHover,
      accentTextColor,
      link{${linkQuery}},
      imageScale,
      verticalOffset
    },
    transition{
      matrixColor,
      density,
      speed,
      softness,
      headerEffectEnabled
    }
  }
`;
