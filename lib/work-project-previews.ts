import { CASE_STUDIES } from "./case-studies";
import { WORK_TITLE_CARDS } from "./work-assets";
import type { ResolvedFloatingProject } from "./work-projects";

// Additional films for the Work collection. The homepage keeps its existing
// composition; client links and full-film destinations remain in the case data.
const additionalProjects = [
  "birthday-bakery",
  "whats-on-your-mind",
  "universal-dictation",
  "viral-creative-producer",
  "meme-booth",
  "keep-it-in-the-neighborhood",
] as const;

export const WORK_PROJECT_PREVIEWS: ResolvedFloatingProject[] = additionalProjects.map((id) => {
  const study = CASE_STUDIES.find((study) => study.campaigns.some((campaign) => campaign.id === id))!;
  const campaign = study.campaigns.find((campaign) => campaign.id === id)!;
  const film = campaign.film!;
  return {
    _key: `project-${id}`,
    title: campaign.title.toUpperCase(),
    href: `/work/${study.slug}#${id}`,
    caseStudyHref: `/work/${study.slug}#${id}`,
    interactionMode: "link",
    mediaType: "video",
    videoUrl: film.preview,
    videoPosterUrl: film.poster,
    titleCardUrl: WORK_TITLE_CARDS[id],
    expandedMediaType: "video",
    expandedVideoUrl: film.src,
    expandedVideoPosterUrl: film.poster,
    mediaFit: "contain",
    mediaAspectRatio: film.width / film.height,
    aspectRatio: film.width < film.height ? "portrait" : "landscape",
  };
});
