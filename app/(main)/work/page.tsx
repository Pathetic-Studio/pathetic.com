import type { Metadata } from "next";
import CaseStudyIndex from "@/components/case-study/case-study-index";

export const metadata: Metadata = {
  title: { absolute: "Our Work — PATHETIC" },
  description:
    "Case studies for Deel, Stream by Sandbar, Air, Ramp, and Square & Cash App.",
};

export default function CaseStudyRoute() {
  return <CaseStudyIndex />;
}
