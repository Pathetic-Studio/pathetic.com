//app/(main)/page.tsx
import Blocks from "@/components/blocks";
import HomeContentGate from "@/components/home-content-gate";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { fetchPageLoader } from "@/sanity/lib/fetch-page-loader";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";
import { preload } from "react-dom";
import { getIntroSprites } from "@/lib/intro-assets";

export async function generateMetadata() {
  const page = await fetchSanityPageBySlug({ slug: "index" });

  return generatePageMetadata({ page, slug: "index" });
}

export default async function IndexPage() {
  const [page, loaderDoc] = await Promise.all([
    fetchSanityPageBySlug({ slug: "index" }),
    fetchPageLoader(),
  ]);

  if (!page) {
    return MissingSanityPage({ document: "page", slug: "index" });
  }

  // These are the opening animation, so discover them in the HTML rather than
  // waiting for hydration and the physics engine to request them one at a time.
  if (loaderDoc?.enabled) {
    getIntroSprites(loaderDoc).forEach(({ url }) => {
      if (url) preload(url, { as: "image", crossOrigin: "anonymous", fetchPriority: "high" });
    });
  }

  return (
    <HomeContentGate initiallyHidden={!!loaderDoc?.enabled}>
      <Blocks blocks={page?.blocks ?? []} />
    </HomeContentGate>
  );
}
