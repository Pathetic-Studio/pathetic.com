// sanity/lib/fetch-page-loader.ts
import { sanityFetch } from "./live";
import { PAGE_LOADER_QUERY } from "../queries/page-loader";

export type PageLoaderResult = Awaited<ReturnType<typeof fetchPageLoader>>;

export async function fetchPageLoader() {
  const { data } = await sanityFetch({
    query: PAGE_LOADER_QUERY,
    perspective: "published",
    stega: false,
  });

  return data;
}
