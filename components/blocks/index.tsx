import { PAGE_QUERYResult } from "@/sanity.types";
import Hero1 from "@/components/blocks/hero/hero-1";
import Hero2 from "@/components/blocks/hero/hero-2";
import SectionHeader from "@/components/blocks/section-header";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import Carousel1 from "@/components/blocks/carousel/carousel-1";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import TimelineRow from "@/components/blocks/timeline/timeline-row";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import FAQs from "@/components/blocks/faqs";
import AllPosts from "@/components/blocks/all-posts";
import SectionSpacer from "@/components/blocks/section-spacer";
import GridRowImage from "@/components/blocks/grid/grid-row-image";
import GridRowAnimated from "@/components/blocks/grid/grid-row-animated";
import SplitRowAnimated from "@/components/blocks/split/split-row-animated";
import GridRowGrab from "@/components/blocks/grid/grid-row-grab";
import PageHeader from "@/components/blocks/page-header/page-header";
import CentralTextBlock from "@/components/blocks/central-text-block";
import FooterBlock, { type FooterBlock as FooterBlockType } from "@/components/blocks/footer";
import LifecycleSlideshow from "@/components/blocks/lifecycle/lifecycle-slideshow";
import CredibilitySection from "@/components/blocks/credibility/credibility-section";
import WhatWeDoSection from "@/components/blocks/what-we-do/what-we-do-section";
import WhatWeDoGridSection from "@/components/blocks/what-we-do-grid/what-we-do-grid-section";
import TalentMatrixSection from "@/components/blocks/talent-matrix/talent-matrix-section";
import WhatWeDoTalentSequence from "@/components/blocks/talent-matrix/what-we-do-talent-sequence";
import NetworkReachSection from "@/components/blocks/network-reach/network-reach-section";
import BeliefSection from "@/components/blocks/belief/belief-section";
import ProjectCtaSection, { type ProjectCtaSectionBlock } from "@/components/blocks/project-cta/project-cta-section";
import BasketLinksSection, { type BasketLinksSectionBlock } from "@/components/blocks/basket-links/basket-links-section";
import BingoFooter, { type BingoFooterBlock } from "@/components/blocks/bingo-footer/bingo-footer";

type Block =
  | NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number]
  | FooterBlockType
  | ProjectCtaSectionBlock
  | BasketLinksSectionBlock
  | BingoFooterBlock;

const componentMap: {
  [K in Block["_type"]]: React.ComponentType<Extract<Block, { _type: K }>>;
} = {
  "hero-1": Hero1,
  "hero-2": Hero2,
  "section-header": SectionHeader,
  "split-row": SplitRow,
  "grid-row": GridRow,
  "grid-row-image": GridRowImage,
  "grid-row-animated": GridRowAnimated,
  "carousel-1": Carousel1,
  "carousel-2": Carousel2,
  "timeline-row": TimelineRow,
  "cta-1": Cta1,
  "logo-cloud-1": LogoCloud1,
  faqs: FAQs,
  "all-posts": AllPosts,
  "section-spacer": SectionSpacer,
  "split-row-animated": SplitRowAnimated,
  "grid-row-grab": GridRowGrab,
  "page-header": PageHeader,
  "central-text-block": CentralTextBlock,
  footer: FooterBlock,
  "lifecycle-slideshow": LifecycleSlideshow,
  "credibility-section": CredibilitySection,
  "what-we-do-section": WhatWeDoSection,
  "what-we-do-grid-section": WhatWeDoGridSection,
  "talent-matrix-section": TalentMatrixSection,
  "network-reach-section": NetworkReachSection,
  "belief-section": BeliefSection,
  "project-cta-section": ProjectCtaSection,
  "basket-links-section": BasketLinksSection,
  "bingo-footer": BingoFooter,
};

export default function Blocks({ blocks }: { blocks: Block[] }) {
  const rendered: React.ReactNode[] = [];

  for (let index = 0; index < (blocks?.length || 0); index += 1) {
    const block = blocks[index];
    const nextBlock = blocks[index + 1];

    if (
      block?._type === "what-we-do-grid-section" &&
      nextBlock?._type === "talent-matrix-section"
    ) {
      rendered.push(
        <WhatWeDoTalentSequence
          key={`${block._key}-${nextBlock._key}`}
          whatWeDo={block}
          talent={nextBlock}
        />,
      );
      index += 1;
      continue;
    }

    const Component = componentMap[block._type];
    if (!Component) {
      console.warn(`No component implemented for block type: ${block._type}`);
      rendered.push(<div data-type={block._type} key={block._key} />);
      continue;
    }
    rendered.push(<Component {...(block as any)} key={block._key} />);
  }

  return <>{rendered}</>;
}
