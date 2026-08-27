import { groq } from "next-sanity";
import { linkQuery } from "./shared/link";

// @sanity-typegen-ignore
export const bingoFooterQuery = groq`
  _type == "bingo-footer" => {
    _type,
    _key,
    backgroundColor{hex},
    textColor{hex},
    leftCells[]{_key,label,icon,action,column,row,link{${linkQuery}}},
    rightCells[]{_key,label,icon,action,column,row,link{${linkQuery}}}
  }
`;
