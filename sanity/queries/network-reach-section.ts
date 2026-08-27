import { groq } from "next-sanity";
import { anchorQuery } from "./shared/anchor";
import { imageQuery } from "./shared/image";
import { linkQuery } from "./shared/link";

// @sanity-typegen-ignore
export const networkReachSectionQuery = groq`
  _type == "network-reach-section" => {
    _type,
    _key,
    ${anchorQuery},
    backgroundColor{hex},
    textColor{hex},
    eyebrow,
    headlineLead,
    headlineMain,
    description,
    eyes[]{
      _key,
      x,
      y,
      size,
      xMobile,
      yMobile,
      sizeMobile
    },
    enableClickToAddEyes,
    eyeSpawnMinScale,
    eyeSpawnMaxScale,
    brandLabel,
    brandImage{
      ${imageQuery}
    },
    orbitDuration,
    orbitTilt,
    reachPoints[]{
      _key,
      value,
      label,
      angle
    },
    detailStats[]{
      _key,
      title,
      value
    },
    friendsTitle,
    friendsDescription,
    friends[]{
      _key,
      name,
      link{
        ${linkQuery}
      },
      image{
        ${imageQuery}
      }
    }
  }
`;
