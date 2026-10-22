"use client";

import type { RefObject } from "react";
import type { PAGE_QUERYResult } from "@/sanity.types";
import CredibilityUniverseSection from "./credibility-universe-section";
import type { SpaceTransition } from "./credibility-space-transition";

type PageBlock = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
export type SpaceCredibilityBlock = Extract<PageBlock, { _type: "credibility-section" }>;

/** Alternate presentation; the original universe/white-label version is kept. */
export default function CredibilitySpaceSection(props: SpaceCredibilityBlock & { transition?: RefObject<SpaceTransition> }) {
  return <CredibilityUniverseSection {...props} labelStyle="tech" objectStyle="images" />;
}
