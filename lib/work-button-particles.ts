import { WORK_COLLECTION } from "./work-projects";
import { WORK_PROJECT_PREVIEWS } from "./work-project-previews";

/** The same brand objects and real project cards shown on the complete Work page. */
export const WORK_BUTTON_PARTICLES = [...WORK_COLLECTION, ...WORK_PROJECT_PREVIEWS]
  .map((item) => ({ _key: item._key, url: item.imageUrl || item.titleCardUrl || item.videoPosterUrl }))
  .filter((item): item is { _key: string; url: string } => Boolean(item.url));
