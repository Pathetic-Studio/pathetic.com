import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CASE_STUDIES, type CaseStudy } from "@/lib/case-studies";
import CaseStudyVideo from "./case-study-video";
import CaseStudyOrbitGallery from "./case-study-orbit-gallery";
import CaseStudyObject from "./case-study-object";
import CaseStudyHeaderContrast from "./case-study-header-contrast";
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

function ProjectCopy({ copy }: { copy: string }) {
  return copy.split(/(Hoso Basque|Selma Kaci)/).map((part, i) => {
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
  });
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
          <Link className={styles.back} href="/case-study">
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
                  <div
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
                  </div>
                </div>
                <div
                  className={`${styles.projectBody} ${!campaign.film && study.slug !== "air" ? styles.copyOnly : ""}`}
                >
                  <div className={styles.copy}>
                    <p>
                      <ProjectCopy copy={campaign.copy} />
                    </p>
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
                    {study.slug === "air" && (
                      <a
                        className={styles.link}
                        href="https://www.instagram.com/p/DYBD07ksEpG/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch Mike’s explainer
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
                      <figcaption>Watch</figcaption>
                    </figure>
                  )}
                  {study.slug === "air" && (
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
                {campaign.images?.length ? (
                  <div className={styles.bts}>
                    {campaign.images.map((photo) => (
                      <figure key={photo.src}>
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          width={photo.width}
                          height={photo.height}
                          sizes="(max-width: 760px) 80vw, 500px"
                        />
                        <figcaption>Behind the scenes</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
          {!!study.images?.length && (
            <section
              className={styles.gallery}
              aria-label={`${study.client} gallery`}
            >
              {study.slug === "air" && <h2>Out in the wild</h2>}
              <CaseStudyOrbitGallery
                images={study.images}
                label={`${study.client} gallery`}
              />
            </section>
          )}
        </div>
      </div>
      <section
        className={styles.next}
        data-case-next-panel={next.slug}
        data-case-surface={next.ink === "#ffffff" ? "dark" : "light"}
        style={{ background: next.accent, color: next.ink || "#171717" }}
      >
        <Link
          href={`/case-study/${next.slug}`}
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
