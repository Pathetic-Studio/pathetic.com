import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";

import PortableTextRenderer from "@/components/portable-text-renderer";
import TitleText from "@/components/ui/title-text";
import { cn } from "@/lib/utils";

type CaseStudyData = {
  title?: string | null;
  eyebrow?: string | null;
  heroImage?: { asset?: { url?: string | null } | null; alt?: string | null } | null;
  heroOrbitImages?: Array<{
    _key?: string | null;
    asset?: { url?: string | null } | null;
    alt?: string | null;
  }> | null;
  intro?: any;
  storySections?: Array<{
    _key?: string | null;
    image?: { asset?: { url?: string | null } | null; alt?: string | null } | null;
    copy?: any;
    imageWidth?: string | null;
  }> | null;
  relatedTitle?: string | null;
  relatedProjects?: Array<{
    _key?: string | null;
    title?: string | null;
    image?: { asset?: { url?: string | null } | null; alt?: string | null } | null;
    link?: { href?: string | null; target?: boolean | null } | null;
  }> | null;
} | null;

const ORBIT_POSITIONS = [
  "left-[8%] top-[14%] w-[12%]",
  "left-[18%] top-[54%] w-[10%]",
  "right-[14%] top-[13%] w-[11%]",
  "right-[7%] top-[52%] w-[10%]",
  "left-[35%] top-[8%] w-[8%]",
  "right-[34%] top-[67%] w-[8%]",
] as const;

const IMAGE_WIDTHS: Record<string, string> = {
  small: "max-w-xl",
  medium: "max-w-3xl",
  large: "max-w-5xl",
};

export default function CaseStudyPage({ data }: { data: CaseStudyData }) {
  const title = stegaClean(data?.title) || "CASE STUDY";
  const orbitImages = (data?.heroOrbitImages ?? []).filter(
    (image) => image.asset?.url,
  );
  const storySections = data?.storySections ?? [];
  const relatedProjects = data?.relatedProjects ?? [];

  return (
    <main className="min-h-screen overflow-hidden bg-background pt-24 text-foreground sm:pt-28 lg:pt-32">
      <section className="relative mx-auto flex min-h-[78svh] max-w-[110rem] flex-col items-center justify-center px-5 py-20 text-center">
        {orbitImages.map((image, index) => (
          <div
            key={image._key || `${image.asset?.url}-${index}`}
            className={cn(
              "pointer-events-none absolute hidden aspect-square md:block",
              ORBIT_POSITIONS[index % ORBIT_POSITIONS.length],
            )}
          >
            <Image
              src={image.asset!.url!}
              alt={stegaClean(image.alt) || ""}
              fill
              sizes="14vw"
              className="object-contain"
            />
          </div>
        ))}

        {data?.eyebrow && (
          <p className="mb-6 text-base font-bold uppercase italic tracking-[-.03em] sm:text-xl">
            {stegaClean(data.eyebrow)}
          </p>
        )}
        <TitleText
          variant="stretched"
          as="h1"
          size="matrix-talent"
          maxChars={24}
          singleLine
          textOutline
          outlineColor="#050505"
          outlineWidth={1.5}
          outlinePosition="outside"
          stretchScaleX={0.76}
          overallScale={1.08}
          className="relative z-20 !w-full [&_h1]:leading-[.76] [&_h1]:tracking-[-.055em]"
        >
          {title}
        </TitleText>

        <div className="relative z-10 mt-[-1.5rem] aspect-square w-[min(55vw,25rem)] sm:mt-[-2.5rem]">
          {data?.heroImage?.asset?.url ? (
            <Image
              src={data.heroImage.asset.url}
              alt={stegaClean(data.heroImage.alt) || title}
              fill
              priority
              sizes="(min-width: 1024px) 400px, 55vw"
              className="object-contain"
            />
          ) : (
            <div className="absolute inset-[12%] border border-current/30 bg-current/[.03]" />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16 text-center text-[clamp(1.1rem,1.65vw,1.45rem)] leading-[1.22] sm:pb-24">
        {data?.intro ? (
          <PortableTextRenderer value={data.intro} />
        ) : (
          <p>Add the project introduction in the Case Study singleton.</p>
        )}
      </section>

      <div className="space-y-24 px-5 pb-28 sm:space-y-32 sm:px-8 lg:pb-40">
        {storySections.map((section, index) => {
          const width = stegaClean(section.imageWidth) || "medium";
          return (
            <section
              key={section._key || `story-${index}`}
              className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center"
            >
              {section.image?.asset?.url && (
                <div
                  className={cn(
                    "relative aspect-[4/3] w-full overflow-hidden",
                    IMAGE_WIDTHS[width] || IMAGE_WIDTHS.medium,
                  )}
                >
                  <Image
                    src={section.image.asset.url}
                    alt={stegaClean(section.image.alt) || ""}
                    fill
                    sizes="(min-width: 1024px) 960px, 92vw"
                    className="object-cover"
                  />
                </div>
              )}
              {section.copy && (
                <div className="max-w-3xl text-[clamp(1.05rem,1.45vw,1.3rem)] leading-[1.25]">
                  <PortableTextRenderer value={section.copy} />
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32">
        <TitleText
          variant="stretched"
          as="h2"
          size="matrix-accent"
          maxChars={34}
          singleLine
          stretchScaleX={0.76}
          className="mb-12 !w-full [&_h2]:leading-[.8] [&_h2]:tracking-[-.05em]"
        >
          {stegaClean(data?.relatedTitle) || "VIEW MORE OF OUR WORK"}
        </TitleText>
        {relatedProjects.length > 0 && (
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:gap-16">
            {relatedProjects.map((project, index) => {
              const href = stegaClean(project.link?.href) || "#";
              return (
                <Link
                  key={project._key || `${project.title}-${index}`}
                  href={href}
                  target={project.link?.target ? "_blank" : undefined}
                  className="group flex flex-col items-center gap-4 text-center"
                >
                  <div className="relative aspect-square w-[min(28vw,12rem)] transition-transform duration-300 ease-out group-hover:scale-105">
                    {project.image?.asset?.url ? (
                      <Image
                        src={project.image.asset.url}
                        alt={stegaClean(project.image.alt) || stegaClean(project.title) || ""}
                        fill
                        sizes="192px"
                        className="object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 border border-current/30" />
                    )}
                  </div>
                  <span className="text-sm font-bold uppercase sm:text-base">
                    {stegaClean(project.title)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
