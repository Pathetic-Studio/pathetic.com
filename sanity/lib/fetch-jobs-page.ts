import { cache } from "react";
import { sanityFetch } from "./live";
import { JOBS_PAGE_QUERY } from "../queries/jobs-page";

export type JobsPageData = {
  _id?: string | null;
  title?: string | null;
  eyebrow?: string | null;
  emptyMessage?: string | null;
  jobs?: Array<{
    _key?: string | null;
    active?: boolean | null;
    title?: string | null;
    starColor?: "yellow" | "pink" | "blue" | "orange" | null;
    team?: string | null;
    location?: string | null;
    employmentType?: string | null;
    summary?: string | null;
    applyUrl?: string | null;
    applyLabel?: string | null;
    position?: {
      x?: number | null;
      y?: number | null;
      z?: number | null;
    } | null;
  }> | null;
  meta_title?: string | null;
  meta_description?: string | null;
  noindex?: boolean | null;
} | null;

export const fetchJobsPage = cache(async (): Promise<JobsPageData> => {
  const { data } = await sanityFetch({ query: JOBS_PAGE_QUERY });
  return data as JobsPageData;
});
