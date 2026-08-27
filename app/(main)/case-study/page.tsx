import CaseStudyPage from "@/components/case-study/case-study-page";
import { fetchCaseStudy } from "@/sanity/lib/fetch-case-study";

export async function generateMetadata() {
  const data = await fetchCaseStudy();
  return {
    title: data?.meta_title || data?.title || "Case Study",
    description: data?.meta_description || undefined,
    robots: data?.noindex ? "noindex" : undefined,
  };
}

export default async function CaseStudyRoute() {
  const data = await fetchCaseStudy();
  return <CaseStudyPage data={data} />;
}
