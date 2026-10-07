import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ClientCaseStudy from "@/components/case-study/client-case-study";
import { CASE_STUDIES, getCaseStudy } from "@/lib/case-studies";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CASE_STUDIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  return {
    title: { absolute: `${study.client} — PATHETIC` },
    description: study.intro,
    openGraph: {
      title: `${study.client} — PATHETIC`,
      description: study.intro,
      ...(study.cover
        ? { images: [{ url: study.cover.src, alt: study.cover.alt }] }
        : {}),
    },
  };
}

export default async function CaseStudyRoute({ params }: Props) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();
  return <ClientCaseStudy study={study} />;
}
