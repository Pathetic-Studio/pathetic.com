//sanity/queries/page.ts
import { groq } from "next-sanity";
import { hero1Query } from "./hero/hero-1";
import { hero2Query } from "./hero/hero-2";
import { sectionHeaderQuery } from "./section-header";
import { splitRowQuery } from "./split/split-row";
import { gridRowQuery } from "./grid/grid-row";
import { carousel1Query } from "./carousel/carousel-1";
import { carousel2Query } from "./carousel/carousel-2";
import { timelineQuery } from "./timeline";
import { cta1Query } from "./cta/cta-1";
import { logoCloud1Query } from "./logo-cloud/logo-cloud-1";
import { faqsQuery } from "./faqs";
import { formNewsletterQuery } from "./forms/newsletter";
import { allPostsQuery } from "./all-posts";
import { sectionSpacerQuery } from "./section-spacer";
import { gridRowImageQuery } from "./grid/grid-row-image-query";
import { gridRowAnimatedQuery } from "./grid/grid-row-animated";
import { splitRowAnimatedQuery } from "./split/split-row-animated";
import { gridRowGrabQuery } from "./grid/grid-row-grab";
import { pageHeaderQuery } from "./hero/page-header";
import { centralTextBlockQuery } from "./central-text-block";
import { footerQuery } from "./footer";
import { lifecycleSlideshowQuery } from "./lifecycle-slideshow";
import { credibilitySectionQuery } from "./credibility-section";
import { whatWeDoSectionQuery } from "./what-we-do-section";
import { whatWeDoGridSectionQuery } from "./what-we-do-grid-section";
import { talentMatrixSectionQuery } from "./talent-matrix-section";
import { networkReachSectionQuery } from "./network-reach-section";
import { beliefSectionQuery } from "./belief-section";
import { projectCtaSectionQuery } from "./project-cta-section";
import { basketLinksSectionQuery } from "./basket-links-section";
import { bingoFooterQuery } from "./bingo-footer";

export const PAGE_QUERY = groq`
  *[_type == "page" && slug.current == $slug][0]{
    blocks[]{
      ${hero1Query},
      ${hero2Query},
      ${sectionHeaderQuery},
      ${splitRowQuery},
      ${gridRowQuery},
      ${carousel1Query},
      ${carousel2Query},
      ${timelineQuery},
      ${cta1Query},
      ${logoCloud1Query},
      ${faqsQuery},
      ${allPostsQuery},
      ${sectionSpacerQuery},
      ${gridRowImageQuery},
      ${gridRowAnimatedQuery},
      ${splitRowAnimatedQuery},
      ${gridRowGrabQuery},
      ${pageHeaderQuery},
      ${centralTextBlockQuery},
      ${footerQuery},
      ${lifecycleSlideshowQuery},
      ${credibilitySectionQuery},
      ${whatWeDoSectionQuery},
      ${whatWeDoGridSectionQuery},
      ${talentMatrixSectionQuery},
      ${networkReachSectionQuery},
      ${beliefSectionQuery},
      ${projectCtaSectionQuery},
      ${basketLinksSectionQuery},
      ${bingoFooterQuery},

    },
    meta_title,
    meta_description,
    noindex,
    ogImage {
      asset->{
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      },
    }
  }
`;

export const PAGES_SLUGS_QUERY = groq`*[_type == "page" && defined(slug)]{slug}`;
