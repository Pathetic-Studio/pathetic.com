import { sanityFetch } from "@/sanity/lib/live";

// Queries
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { NAVIGATION_QUERY } from "@/sanity/queries/navigation";
import { SETTINGS_QUERY } from "@/sanity/queries/settings";
import { MEME_BOOTH_QUERY } from "@/sanity/queries/meme-booth";
import {
  POST_QUERY,
  POSTS_QUERY,
  POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";

// Types
import {
  PAGE_QUERYResult,
  PAGES_SLUGS_QUERYResult,
  POST_QUERYResult,
  POSTS_QUERYResult,
  POSTS_SLUGS_QUERYResult,
  NAVIGATION_QUERYResult,
  SETTINGS_QUERYResult,
  MEME_BOOTH_QUERYResult,
} from "@/sanity.types";

/* -------------------------------------
 * PAGES
 * -----------------------------------*/
export async function fetchSanityPageBySlug({
  slug,
}: {
  slug: string;
}): Promise<PAGE_QUERYResult> {
  const { data } = await sanityFetch({
    query: PAGE_QUERY,
    params: { slug },
  });

  return data;
}

export async function fetchSanityPagesStaticParams(): Promise<PAGES_SLUGS_QUERYResult> {
  const { data } = await sanityFetch({
    query: PAGES_SLUGS_QUERY,
    perspective: "published",
    stega: false,
  });

  return data;
}

/* -------------------------------------
 * POSTS
 * -----------------------------------*/
export async function fetchSanityPosts(): Promise<POSTS_QUERYResult> {
  const { data } = await sanityFetch({
    query: POSTS_QUERY,
  });

  return data;
}

export async function fetchSanityPostBySlug({
  slug,
}: {
  slug: string;
}): Promise<POST_QUERYResult> {
  const { data } = await sanityFetch({
    query: POST_QUERY,
    params: { slug },
  });

  return data;
}

export async function fetchSanityPostsStaticParams(): Promise<POSTS_SLUGS_QUERYResult> {
  const { data } = await sanityFetch({
    query: POSTS_SLUGS_QUERY,
    perspective: "published",
    stega: false,
  });

  return data;
}

/* -------------------------------------
 * NAVIGATION
 * -----------------------------------*/
export async function fetchSanityNavigation(): Promise<NAVIGATION_QUERYResult> {
  const { data } = await sanityFetch({
    query: NAVIGATION_QUERY,
  });

  return data;
}

/* -------------------------------------
 * SETTINGS
 * -----------------------------------*/
export async function fetchSanitySettings(): Promise<SETTINGS_QUERYResult> {
  const { data } = await sanityFetch({
    query: SETTINGS_QUERY,
  });

  return data;
}

/* -------------------------------------
 * MEME BOOTH (single document)
 * -----------------------------------*/
export async function fetchMemeBooth(): Promise<MEME_BOOTH_QUERYResult> {
  const { data } = await sanityFetch({
    query: MEME_BOOTH_QUERY,
  });

  return data;
}
