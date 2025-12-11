import { type SchemaTypeDefinition } from "sanity";
// documents
import page from "./schemas/documents/page";
import post from "./schemas/documents/post";
import author from "./schemas/documents/author";
import category from "./schemas/documents/category";
import faq from "./schemas/documents/faq";
import testimonial from "./schemas/documents/testimonial";
import navigation from "./schemas/documents/navigation";
import settings from "./schemas/documents/settings";
// Schema UI shared objects
import blockContent from "./schemas/blocks/shared/block-content";
import link from "./schemas/blocks/shared/link";
import { colorVariant } from "./schemas/blocks/shared/color-variant";
import { buttonVariant } from "./schemas/blocks/shared/button-variant";
import sectionPadding from "./schemas/blocks/shared/section-padding";
// Schema UI objects
import hero1 from "./schemas/blocks/hero/hero-1";
import hero2 from "./schemas/blocks/hero/hero-2";
import sectionHeader from "./schemas/blocks/section-header";
import splitRow from "./schemas/blocks/split/split-row";
import splitContent from "./schemas/blocks/split/split-content";
import splitCardsList from "./schemas/blocks/split/split-cards-list";
import splitCard from "./schemas/blocks/split/split-card";
import splitImage from "./schemas/blocks/split/split-image";
import splitInfoList from "./schemas/blocks/split/split-info-list";
import splitInfo from "./schemas/blocks/split/split-info";
import gridCard from "./schemas/blocks/grid/grid-card";
import pricingCard from "./schemas/blocks/grid/pricing-card";
import gridPost from "./schemas/blocks/grid/grid-post";
import gridRow from "./schemas/blocks/grid/grid-row";
import carousel1 from "./schemas/blocks/carousel/carousel-1";
import carousel2 from "./schemas/blocks/carousel/carousel-2";
import timelineRow from "./schemas/blocks/timeline/timeline-row";
import timelinesOne from "./schemas/blocks/timeline/timelines-1";
import cta1 from "./schemas/blocks/cta/cta-1";
import logoCloud1 from "./schemas/blocks/logo-cloud/logo-cloud-1";
import faqs from "./schemas/blocks/faqs";
import newsletter from "./schemas/blocks/forms/newsletter";
import allPosts from "./schemas/blocks/all-posts";
import heroFeature from "./schemas/blocks/shared/hero-feature";
import splitImageAnimate from "./schemas/blocks/split/split-image-animate";
import sectionSpacer from "./schemas/blocks/section-spacer";
import gridTextBlock from "./schemas/blocks/grid/grid-text-block";
import gridRowImage from "./schemas/blocks/grid/grid-row-image";
import objectDetectImage from "./schemas/blocks/grid/object-detect-image";
import imageCard from "./schemas/blocks/grid/image-card";
import insetBackground from "./schemas/blocks/shared/background";
import gridRowAnimated from "./schemas/blocks/grid/grid-row-animated";
import splitRowAnimated from "./schemas/blocks/split/split-row-animated";
import splitCardsListAnimated from "./schemas/blocks/split/split-cards-list-animated";
import gridCardAnimated from "./schemas/blocks/grid/grid-card-animated";
import contactSubmission from "./schemas/blocks/contact-submission";
import memeBooth from "./schemas/documents/meme-booth";
import background from "./schemas/blocks/shared/background";
import gridRowGrab from "./schemas/blocks/grid/grid-row-grab";
import sectionAnchor from "./schemas/blocks/shared/section-anchor";
import pageHeader from "./schemas/blocks/page-header";
import pageLoader from "./schemas/blocks/page-loader";
import centralTextBlock from "./schemas/blocks/central-text-block";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    page,
    post,
    author,
    category,
    faq,
    testimonial,
    navigation,
    settings,
    memeBooth,
    // shared objects
    blockContent,
    contactSubmission,
    link,
    colorVariant,
    buttonVariant,
    sectionPadding,
    heroFeature,
    background,
    // blocks
    hero1,
    hero2,
    sectionHeader,
    splitRow,
    splitContent,
    splitCardsList,
    splitCard,
    splitImage,
    splitImageAnimate,
    splitInfoList,
    splitInfo,
    splitRowAnimated,
    splitCardsListAnimated,
    gridCardAnimated,
    gridCard,
    pricingCard,
    gridPost,
    gridTextBlock,
    gridRowAnimated,
    gridRow,
    gridRowImage,
    gridRowGrab,
    objectDetectImage,
    imageCard,
    carousel1,
    carousel2,
    timelineRow,
    timelinesOne,
    cta1,
    logoCloud1,
    faqs,
    allPosts,
    sectionSpacer,
    sectionAnchor,
    pageHeader,
    pageLoader,
    centralTextBlock,
  ],
};
