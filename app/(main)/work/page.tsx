import type { Metadata } from "next";
import CaseStudyIndex from "@/components/case-study/case-study-index";
import BingoFooter, {
  type BingoFooterBlock,
} from "@/components/blocks/bingo-footer/bingo-footer";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";

export const metadata: Metadata = {
  title: { absolute: "Our Work — PATHETIC" },
  description:
    "Case studies for Deel, Stream by Sandbar, Air, Ramp, and Square & Cash App.",
};

export default async function CaseStudyRoute() {
  const home = await fetchSanityPageBySlug({ slug: "index" });
  const footer = home?.blocks?.find(
    (block) => block._type === "bingo-footer",
  ) as BingoFooterBlock | undefined;

  return (
    <>
      <CaseStudyIndex />
      {footer && <BingoFooter {...footer} />}
    </>
  );
}
