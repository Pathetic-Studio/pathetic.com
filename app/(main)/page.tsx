//app/(main)/page.tsx
import Blocks from "@/components/blocks";
import HomeContentGate from "@/components/home-content-gate";
import { fetchSanityPageBySlug } from "@/sanity/lib/fetch";
import { fetchPageLoader } from "@/sanity/lib/fetch-page-loader";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import MissingSanityPage from "@/components/ui/missing-sanity-page";

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

  return (
    <HomeContentGate initiallyHidden={!!loaderDoc?.enabled}>
      <Blocks blocks={page?.blocks ?? []} />
    </HomeContentGate>
  );
}
