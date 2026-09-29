import JobsPage from "@/components/jobs/jobs-page";
import { fetchJobsPage } from "@/sanity/lib/fetch-jobs-page";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export async function generateMetadata() {
  const data = await fetchJobsPage();
  return {
    title: data?.meta_title || data?.title || "Jobs",
    description:
      data?.meta_description
      || "Find open roles and come work with Pathetic.",
    robots: !isProduction
      ? "noindex, nofollow"
      : data?.noindex
        ? "noindex"
        : "index, follow",
  };
}

export default async function JobsRoute() {
  const data = await fetchJobsPage();
  return <JobsPage data={data} />;
}
