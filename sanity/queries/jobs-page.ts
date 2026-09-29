import { groq } from "next-sanity";

export const JOBS_PAGE_QUERY = groq`
  *[_type == "jobsPage" && _id == "jobsPage"][0]{
    _id,
    title,
    eyebrow,
    emptyMessage,
    jobs[]{
      _key,
      active,
      title,
      starColor,
      team,
      location,
      employmentType,
      summary,
      applyUrl,
      applyLabel,
      position{
        x,
        y,
        z
      }
    },
    meta_title,
    meta_description,
    noindex
  }
`;
