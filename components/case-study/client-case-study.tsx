import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  CASE_STUDIES,
  type CaseStudy,
  type CaseStudyCampaign,
  type CaseStudyGallery,
  type CaseStudyText,
} from "@/lib/case-studies";
import CaseStudyVideo from "./case-study-video";
import CaseStudyResults from "./case-study-results";
import TitleText from "@/components/ui/title-text";
import GalleryImage from "@/components/ui/gallery-image";
import CaseStudyImageGallery from "./case-study-image-gallery";
import CaseStudyObject from "./case-study-object";
import CaseStudyHeaderContrast from "./case-study-header-contrast";
import InstagramPostLink from "./instagram-post-link";
import { getInstagramPost } from "@/lib/instagram-posts";
import styles from "./client-case-study.module.css";

const clientNames: Record<string, string[]> = {
  "stream-by-sandbar": ["Sandbar"],
  "square-cash-app": ["Square", "Cash App"],
};

// Style phrases within the existing source copy; don't maintain a second draft.
const introEmphasis: Record<
  string,
  { text: string; strong?: boolean; emphasis?: boolean }[]
> = {
  "stream-by-sandbar": [
    { text: "Stream", strong: true },
    { text: "bring the brand, product and vision to life.", emphasis: true },
  ],
  air: [{ text: "our proven viral format", strong: true, emphasis: true }],
  ramp: [
    { text: "revolutionary product", strong: true },
    { text: "another killer…", emphasis: true },
  ],
  deel: [
    { text: "series, events and campaigns", strong: true },
    { text: "watch, attend, and share.", emphasis: true },
  ],
  "square-cash-app": [
    { text: "make that relationship visible", strong: true, emphasis: true },
  ],
};

function IntroCopy({ study }: { study: CaseStudy }) {
  const spans: CaseStudyText[] = [];
  let offset = 0;
  for (const phrase of introEmphasis[study.slug] || []) {
    const start = study.intro.indexOf(phrase.text, offset);
    if (start < 0) continue;
    spans.push({ text: study.intro.slice(offset, start) }, phrase);
    offset = start + phrase.text.length;
  }
  spans.push({ text: study.intro.slice(offset) });
  return <CopySpans spans={spans} />;
}

function CopySpans({ spans }: { spans: CaseStudyText[] }) {
  return spans.map((span, i) => {
    let content = <>{span.text}</>;
    if (span.emphasis) content = <em>{content}</em>;
    if (span.strong) content = <strong>{content}</strong>;
    return span.href && getInstagramPost(span.href) ? (
      <InstagramPostLink key={i} href={span.href}>
        {content}
      </InstagramPostLink>
    ) : span.href ? (
      <a key={i} href={span.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    ) : (
      <span key={i}>{content}</span>
    );
  });
}

function ProjectCopy({ copy }: { copy: CaseStudyCampaign["copy"] }) {
  if (Array.isArray(copy)) {
    return copy.map((block, i) =>
      block.type === "paragraph" ? (
        <p key={i}>
          <CopySpans spans={block.content} />
        </p>
      ) : (
        <ul key={i}>
          {block.items.map((item, j) => (
            <li key={j}>
              <CopySpans spans={item} />
            </li>
          ))}
        </ul>
      ),
    );
  }
  return (
    <p>
      {copy.split(/(Hoso Basque|Selma Kaci)/).map((part, i) => {
        const href =
          part === "Hoso Basque"
            ? "https://www.instagram.com/hosobasqueparis_/"
            : part === "Selma Kaci"
              ? "https://www.instagram.com/selmakacisebbagh/"
              : null;
        return href ? (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        ) : (
          part
        );
      })}
    </p>
  );
}

function ImageGalleries({
  galleries,
  owner,
  placement,
}: {
  galleries?: CaseStudyGallery[];
  owner: string;
  placement: "project" | "client";
}) {
  const Heading = placement === "project" ? "h3" : "h2";
  return galleries
    ?.filter((gallery) => gallery.images.length)
    .map((gallery) => (
      <section
        key={gallery.id}
        className={styles.gallery}
        data-case-gallery-block={gallery.id}
        data-case-gallery-placement={placement}
        aria-label={`${owner} — ${gallery.title || "gallery"}`}
      >
        {gallery.title && (
          <Heading className={styles.galleryTitle}>{gallery.title}</Heading>
        )}
        <CaseStudyImageGallery
          images={gallery.images}
          columns={gallery.columns}
          label={`${owner} — ${gallery.title || "gallery"}`}
          framed={placement === "client"}
        />
      </section>
    ));
}

export default function ClientCaseStudy({ study }: { study: CaseStudy }) {
  const index = CASE_STUDIES.findIndex((item) => item.slug === study.slug);
  const next = CASE_STUDIES[(index + 1) % CASE_STUDIES.length];
  return (
    <article
      className={styles.page}
      style={
        {
          "--study-accent": study.accent,
          "--study-ink": study.ink || "#171717",
        } as CSSProperties
      }
    >
      <CaseStudyHeaderContrast slug={study.slug} />
      <div
        className={styles.clientPanel}
        data-case-study-panel={study.slug}
        data-case-surface={study.ink === "#ffffff" ? "dark" : "light"}
      >
        <header className={styles.hero} data-case-client={study.slug}>
          <Link className={styles.back} href="/work">
            ← View all projects
          </Link>
          <CaseStudyObject
            object={study.object}
            additionalObjects={study.additionalObjects}
          />
          <h1 className="sr-only">{study.client}</h1>
          <div className={styles.client} aria-hidden="true">
            <div className={styles.clientMark}>
              {(clientNames[study.slug] || [study.client]).map((name) => (
                <TitleText
                  key={name}
                  as="p"
                  variant="stretched"
                  animation="none"
                  size="case-client"
                  singleLine
                >
                  {name}
                </TitleText>
              ))}
            </div>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.intro}>
              <IntroCopy study={study} />
            </p>
          </div>
          <nav
            className={styles.projectNav}
            aria-label="Projects for this client"
          >
            <span className={styles.projectNavLabel}>Projects</span>
            {study.campaigns.map((campaign) => (
              <a
                key={campaign.id}
                href={`#${campaign.id}`}
                data-case-project-anchor
              >
                <span className={styles.projectLinkStar} aria-hidden="true">
                  <Image
                    src="/images/case-studies/figma/imgStar3.svg"
                    alt=""
                    width={220.184}
                    height={115.827}
                  />
                </span>
                <span className={styles.projectLinkText}>{campaign.title}</span>
                <span className={styles.projectLinkStar} aria-hidden="true">
                  <Image
                    src="/images/case-studies/figma/imgStar3.svg"
                    alt=""
                    width={220.184}
                    height={115.827}
                  />
                </span>
              </a>
            ))}
          </nav>
        </header>
        <div className={styles.projects}>
          {study.campaigns.map((campaign) => {
            const portrait =
              campaign.id !== "youre-on-mute" &&
              campaign.film &&
              campaign.film.height > campaign.film.width;
            return (
              <section
                key={campaign.id}
                id={campaign.id}
                className={styles.project}
                data-case-surface="light"
                aria-labelledby={`${campaign.id}-title`}
              >
                <div
                  className={`${styles.projectBody} ${!campaign.film && study.slug !== "air" ? styles.copyOnly : ""}`}
                >
                  <div className={styles.projectInfo}>
                    <div className={styles.projectHeading} data-has-results={Boolean(campaign.result)}>
                      <p className={styles.eyebrow}>{campaign.format}</p>
                      <div className={styles.projectHeadingText}>
                        <TitleText
                          id={`${campaign.id}-title`}
                          as="h2"
                          variant="stretched"
                          animation="none"
                          size="case-project"
                          maxChars={0}
                          className={styles.projectTitle}
                        >
                          {campaign.title}
                        </TitleText>
                      </div>
                      {campaign.result && (
                        <CaseStudyResults
                          result={campaign.result}
                          id={campaign.id}
                        />
                      )}
                    </div>
                    <div className={styles.copy}>
                      <ProjectCopy copy={campaign.copy} />
                      {campaign.link && (
                        <a
                          className={styles.link}
                          href={campaign.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {campaign.link.label}
                        </a>
                      )}
                    </div>
                  </div>
                  {campaign.film && (
                    <figure
                      className={`${styles.media} ${portrait ? styles.portrait : ""}`}
                    >
                      <CaseStudyVideo
                        film={campaign.film}
                        title={campaign.title}
                        aspectRatio={
                          campaign.id === "youre-on-mute"
                            ? "513 / 378"
                            : campaign.id === "bless-this-desk"
                              ? "375 / 439"
                              : undefined
                        }
                      />
                    </figure>
                  )}
                  {study.slug === "air" && !campaign.film && (
                    <figure className={`${styles.media} ${styles.portrait}`}>
                      <GalleryImage
                        image={study.cover}
                        sizes="(max-width: 760px) 70vw, 350px"
                      />
                    </figure>
                  )}
                </div>
                {campaign.features?.length && (
                  <dl className={styles.features}>
                    {campaign.features.map((feature) => (
                      <div key={feature.title}>
                        <dt>{feature.title}</dt>
                        <dd><CopySpans spans={feature.content} /></dd>
                      </div>
                    ))}
                  </dl>
                )}
                <ImageGalleries
                  galleries={campaign.galleries}
                  owner={campaign.title}
                  placement="project"
                />
              </section>
            );
          })}
          <ImageGalleries
            galleries={study.galleries}
            owner={study.client}
            placement="client"
          />
        </div>
      </div>
      <section
        className={styles.next}
        data-case-next-panel={next.slug}
        data-case-surface={next.ink === "#ffffff" ? "dark" : "light"}
        style={{ background: next.accent, color: next.ink || "#171717" }}
      >
        <Link
          href={`/work/${next.slug}`}
          className={styles.nextLink}
          data-case-next={next.slug}
          data-case-accent={next.accent}
        >
          <span className={styles.nextCopy}>
            <span className={styles.eyebrow}>Next case study</span>
            <span className={styles.nextTitle}>{next.client}</span>
          </span>
        </Link>
        <CaseStudyObject
          object={next.object}
          additionalObjects={next.additionalObjects}
          placement="next"
        />
      </section>
    </article>
  );
}
