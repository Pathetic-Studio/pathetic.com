import type { Metadata } from "next";
import StyleGuide from "./style-guide";
import { HeadingPreview } from "./specimens";

export const metadata: Metadata = {
  title: { absolute: "PATHETIC — Style sheet" },
  robots: { index: false, follow: false },
};

export default async function StyleGuidePage({ searchParams }: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  return preview ? <HeadingPreview /> : <StyleGuide />;
}
