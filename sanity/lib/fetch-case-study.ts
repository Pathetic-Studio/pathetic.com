import { sanityFetch } from "./live";
import { CASE_STUDY_QUERY } from "../queries/case-study";

export async function fetchCaseStudy() {
  const { data } = await sanityFetch({ query: CASE_STUDY_QUERY });
  return data;
}
