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
import CaseStudyImageGallery from "./case-study-image-gallery";
import CaseStudyObject from "./case-study-object";
import CaseStudyHeaderContrast from "./case-study-header-contrast";
import InstagramPostLink from "./instagram-post-link";
import { getInstagramPost } from "@/lib/instagram-posts";
import styles from "./client-case-study.module.css";

const showTitles: Record<
  string,
  { src: string; width: number; height: number }
> = {
  "youre-on-mute": {
    src: "/images/case-studies/figma/imgYoureOnMute.svg",
    width: 758.002,
    height: 148.721,
  },
  "bless-this-desk": {
    src: "/images/case-studies/figma/imgBlessThisDesk.svg",
    width: 772.889,
    height: 125.547,
  },
};

function CopySpans({ spans }: { spans: CaseStudyText[] }) {
  return spans.map((span, i) => {
    let content = <>{span.text}</>;
    if (span.emphasis) content = <em>{content}</em>;
    if (span.strong) content = <strong>{content}</strong>;
    return span.href && getInstagramPost(span.href) ? (
      <InstagramPostLink key={i} href={span.href}>{content}</InstagramPostLink>
    ) : span.href ? (
      <a key={i} href={span.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    ) : <span key={i}>{content}</span>;
  });
}

function ProjectCopy({ copy }: { copy: CaseStudyCampaign["copy"] }) {
  if (Array.isArray(copy)) {
    return copy.map((block, i) => block.type === "paragraph" ? (
      <p key={i}><CopySpans spans={block.content} /></p>
    ) : (
      <ul key={i}>
        {block.items.map((item, j) => (
          <li key={j}><CopySpans spans={item} /></li>
        ))}
      </ul>
    ));
  }
  return <p>{copy.split(/(Hoso Basque|Selma Kaci)/).map((part, i) => {
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
  })}</p>;
}

function ImageGalleries({ galleries, owner, placement }: {
  galleries?: CaseStudyGallery[];
  owner: string;
  placement: "project" | "client";
}) {
  const Heading = placement === "project" ? "h3" : "h2";
  return galleries?.filter((gallery) => gallery.images.length).map((gallery) => (
    <section
      key={gallery.id}
      className={styles.gallery}
      data-case-gallery-block={gallery.id}
      data-case-gallery-placement={placement}
      aria-label={`${owner} — ${gallery.title || "gallery"}`}
    >
      {gallery.title && <Heading className={styles.galleryTitle}>{gallery.title}</Heading>}
      <CaseStudyImageGallery
        images={gallery.images}
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
        <header className={styles.hero}>
          <Link className={styles.back} href="/work">
            ← View all projects
          </Link>
          <CaseStudyObject
            object={study.object}
            additionalObjects={study.additionalObjects}
          />
          <div className={styles.heroCopy}>
            <h1 className={styles.client}>{study.client}</h1>
            <p className={styles.intro}>{study.intro}</p>
          </div>
          <nav
            className={styles.projectNav}
            aria-label="Projects for this client"
          >
            {study.campaigns.map((campaign) => (
              <a
                key={campaign.id}
                href={`#${campaign.id}`}
                data-case-project-anchor
              >
                {campaign.title}
              </a>
            ))}
          </nav>
        </header>
        <div className={styles.projects}>
          {study.campaigns.map((campaign, i) => {
            const identity = showTitles[campaign.id];
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
                <div className={styles.projectHeading}>
                  <p className={styles.eyebrow}>{campaign.format}</p>
                  <h2
                    id={`${campaign.id}-title`}
                    className={styles.projectTitle}
                  >
                    {identity ? (
                      <Image
                        src={identity.src}
                        alt={campaign.title}
                        width={identity.width}
                        height={identity.height}
                        className={styles.showTitle}
                      />
                    ) : (
                      campaign.title
                    )}
                  </h2>
                  {campaign.result && <div
                    className={styles.result}
                    style={
                      {
                        "--badge-color": i % 2 ? "#dfff49" : "#cab9ff",
                      } as CSSProperties
                    }
                  >
                    <Image
                      data-case-result-star
                      src={`/images/case-studies/figma/imgStar${i % 2 ? "3" : "2"}.svg`}
                      alt=""
                      width={i % 2 ? 220.184 : 214.198}
                      height={i % 2 ? 115.827 : 110.082}
                    />
                    <span>{campaign.result}</span>
                  </div>}
                </div>
                <div
                  className={`${styles.projectBody} ${!campaign.film && study.slug !== "air" ? styles.copyOnly : ""}`}
                >
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
                      <Image
                        src={study.cover.src}
                        alt={study.cover.alt}
                        width={study.cover.width}
                        height={study.cover.height}
                        sizes="(max-width: 760px) 70vw, 350px"
                      />
                    </figure>
                  )}
                </div>
                <ImageGalleries galleries={campaign.galleries} owner={campaign.title} placement="project" />
              </section>
            );
          })}
          <ImageGalleries galleries={study.galleries} owner={study.client} placement="client" />
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
